import axios from "axios";
import { parseStringPromise } from "xml2js";
import { LawApiClient, normalizeLawName } from "./LawApiClient.js";
import { RegulationRepository } from "../repositories.js";
import { getDb } from "../firebase.js";
import { collection, addDoc, doc, writeBatch, query, where, getDocs, updateDoc } from "firebase/firestore";
import { summarizeRevision } from "../gemini.js";
import { SyncRun, SyncRunItem, Revision } from "../../src/types/index.js";

const AI_SUMMARY_TIMEOUT_MS = 10000;
const SYNC_AI_TIME_BUDGET_MS = 32000;

async function summarizeWithTimeout(beforeText: string, afterText: string) {
  return Promise.race([
    summarizeRevision(beforeText, afterText),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), AI_SUMMARY_TIMEOUT_MS)),
  ]);
}

export class SyncService {
  private lawApiClient = new LawApiClient();

  async runMonthlySync(
    triggerType: "MANUAL" | "AUTO",
    targetYear?: number,
    targetMonth?: number
  ): Promise<{
    syncRunId: string;
    status: SyncRun["status"];
    totalCount: number;
    changedCount: number;
    failedCount: number;
    elapsedMs: number;
  }> {
    const db = getDb();
    const runStartMs = Date.now();
    const yyyy = targetYear || new Date().getFullYear();
    const monthNum = targetMonth || new Date().getMonth() + 1;
    const mm = String(monthNum).padStart(2, "0");

    // 1. Create SyncRun record
    const syncRunRef = await addDoc(collection(db, "syncRuns"), {
      triggerType,
      targetYear: yyyy,
      targetMonth: monthNum,
      startedAt: new Date().toISOString(),
      completedAt: null,
      status: "RUNNING",
      totalCount: 0,
      changedCount: 0,
      unchangedCount: 0,
      successCount: 0,
      failedCount: 0,
      errorSummary: null,
    } as Omit<SyncRun, "id">);

    try {
      // 2. Fetch active regulations + bulk monthly law index in parallel (~1-2s total)
      const [activeRegs, monthlyIndex] = await Promise.all([
        RegulationRepository.getAllActive(),
        this.lawApiClient.fetchMonthlyLawIndex(yyyy, monthNum),
      ]);

      let changedCount = 0;
      let unchangedCount = 0;
      let successCount = 0;
      let failedCount = 0;

      const checkedAt = new Date().toISOString();
      const pendingItems: Omit<SyncRunItem, "id">[] = [];
      const regIdsToMarkChecked: string[] = [];

      // Partition regulations into unchanged vs matched in this month
      const matchedRegs: Array<{ reg: (typeof activeRegs)[number]; matchedLaws: any[] }> = [];
      for (const reg of activeRegs) {
        const matchedLaws = monthlyIndex.byNormalizedName.get(normalizeLawName(reg.lawName)) || [];
        if (matchedLaws.length === 0) {
          unchangedCount++;
          successCount++;
          pendingItems.push({
            syncRunId: syncRunRef.id,
            regulationId: reg.id,
            status: "UNCHANGED",
            revisionCount: 0,
            startedAt: checkedAt,
            completedAt: checkedAt,
            errorMessage: null,
          });
          regIdsToMarkChecked.push(reg.id);
        } else {
          matchedRegs.push({ reg, matchedLaws });
        }
      }

      // 3. Only fetch revision details & save for regulations that actually changed this month
      const DETAIL_BATCH_SIZE = 5;
      for (let i = 0; i < matchedRegs.length; i += DETAIL_BATCH_SIZE) {
        const slice = matchedRegs.slice(i, i + DETAIL_BATCH_SIZE);
        await Promise.all(
          slice.map(async ({ reg, matchedLaws }) => {
            let status: SyncRunItem["status"] = "SUCCESS";
            let errorMessage: string | null = null;
            let revisionCount = 0;
            const itemStartedAt = new Date().toISOString();

            try {
              const revisions = await this.lawApiClient.fetchRevisionDetailsForMatchedLaws(
                matchedLaws,
                reg.lawName,
                reg.regulationType,
                yyyy,
                mm,
                monthlyIndex.authUsed
              );

              if (revisions.length === 0) {
                status = "UNCHANGED";
                unchangedCount++;
              } else {
                const existingQ = query(collection(db, "revisions"), where("lawName", "==", reg.lawName));
                const existingSnap = await getDocs(existingQ);
                const existingRevisions = existingSnap.docs.map((d) => d.data());

                const uniqueRevisions: typeof revisions = [];
                for (const rev of revisions) {
                  const isDup = uniqueRevisions.some(
                    (u) =>
                      u.promulgationDate === rev.promulgationDate &&
                      u.beforeText === rev.beforeText &&
                      u.afterText === rev.afterText
                  );
                  if (!isDup) uniqueRevisions.push(rev);
                }

                const newRevisions = uniqueRevisions.filter((rev) => {
                  const isDuplicate = existingRevisions.some(
                    (e) =>
                      e.promulgationDate === rev.promulgationDate &&
                      e.beforeText === rev.beforeText &&
                      e.afterText === rev.afterText
                  );
                  return !isDuplicate;
                });

                if (newRevisions.length === 0) {
                  status = "UNCHANGED";
                  unchangedCount++;
                } else {
                  status = "SUCCESS";
                  changedCount++;

                  const aiSummaries = await Promise.all(
                    newRevisions.map(async (rev) => {
                      if (Date.now() - runStartMs > SYNC_AI_TIME_BUDGET_MS) {
                        return null;
                      }
                      return summarizeWithTimeout(rev.beforeText, rev.afterText);
                    })
                  );

                  const revBatch = writeBatch(db);
                  newRevisions.forEach((rev, idx) => {
                    const revisionDocRef = doc(collection(db, "revisions"));
                    revBatch.set(revisionDocRef, {
                      regulationId: reg.id,
                      sourceLawId: rev.sourceLawId,
                      revisionId: rev.revisionId,
                      lawName: reg.lawName,
                      promulgationDate: rev.promulgationDate,
                      enforcementDate: rev.enforcementDate,
                      revisionType: rev.revisionType,
                      beforeText: rev.beforeText,
                      afterText: rev.afterText,
                      diffData: rev.diffData || "",
                      aiSummary: aiSummaries[idx],
                      departments: reg.defaultDepartments || [],
                      note: reg.defaultNote || "",
                      reviewStatus: "NEW",
                      reviewer: null,
                      reviewedAt: null,
                      sourceUrl: rev.sourceUrl,
                      collectedAt: rev.collectedAt,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                      updatedBy: null,
                    } as Omit<Revision, "id">);
                    revisionCount++;
                  });

                  await revBatch.commit();
                }
              }

              successCount++;
              regIdsToMarkChecked.push(reg.id);
            } catch (err: any) {
              status = "FAILED";
              errorMessage = err.message || "Unknown error";
              failedCount++;
            }

            pendingItems.push({
              syncRunId: syncRunRef.id,
              regulationId: reg.id,
              status,
              revisionCount,
              startedAt: itemStartedAt,
              completedAt: new Date().toISOString(),
              errorMessage,
            });
          })
        );
      }

      // 4. Commit syncRunItems and regulation lastCheckedAt in batched writes (max 450 ops per batch)
      const nowIso = new Date().toISOString();
      const writeOps: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];

      for (const item of pendingItems) {
        const itemRef = doc(collection(db, "syncRunItems"));
        writeOps.push((b) => b.set(itemRef, item));
      }
      for (const regId of regIdsToMarkChecked) {
        const regRef = doc(db, "regulations", regId);
        writeOps.push((b) =>
          b.update(regRef, {
            lastCheckedAt: nowIso,
            lastSuccessfulCheckedAt: nowIso,
          })
        );
      }

      const MAX_BATCH_OPS = 450;
      for (let i = 0; i < writeOps.length; i += MAX_BATCH_OPS) {
        const chunk = writeOps.slice(i, i + MAX_BATCH_OPS);
        const batch = writeBatch(db);
        chunk.forEach((applyOp) => applyOp(batch));
        await batch.commit();
      }

      // 5. Optional legislative notices sync (with strict timeout so it never stalls the run)
      const dataApiKey = process.env.DATA_GO_KR_API_KEY;
      if (dataApiKey) {
        try {
          const res = await axios.get(
            "http://apis.data.go.kr/1130000/MllwnoLrsrcInfoService/getMllwnoLrsrcInfoList",
            {
              params: { serviceKey: decodeURIComponent(dataApiKey), pageNo: 1, numOfRows: 100 },
              timeout: 8000,
            }
          );
          const parsed = await parseStringPromise(res.data);

          if (
            parsed.response &&
            parsed.response.body &&
            parsed.response.body[0].items &&
            parsed.response.body[0].items[0].item
          ) {
            const items = parsed.response.body[0].items[0].item;
            const fetchedNotices = items.map((item: any) => ({
              noticeId: `notice-${item.pbancNo?.[0] || Math.random()}`,
              title: item.lrsrcNm?.[0] || "",
              department: item.chrscDptNm?.[0] || "",
              startDate: item.pbancBgngYmd?.[0] || "",
              endDate: item.pbancEndYmd?.[0] || "",
              content: item.ntceMainCn?.[0] || "상세내용 참고",
              status: "입법예고",
              sourceUrl: item.url?.[0] || "https://opinion.lawmaking.go.kr",
              collectedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            }));

            const filteredNotices = fetchedNotices.filter((notice: any) =>
              activeRegs.some((reg) => notice.title.includes(reg.lawName))
            );

            if (filteredNotices.length > 0) {
              const noticeBatch = writeBatch(db);
              for (const notice of filteredNotices) {
                const docRef = doc(collection(db, "legislativeNotices"));
                noticeBatch.set(docRef, notice);
              }
              await noticeBatch.commit();
            }
          }
        } catch (noticeErr: any) {
          console.error("입법예고 API 수집 중 오류:", noticeErr?.message || noticeErr);
        }
      }

      // 6. Finalize SyncRun status
      const finalStatus: SyncRun["status"] =
        failedCount > 0 ? (successCount > 0 ? "PARTIAL_SUCCESS" : "FAILED") : "COMPLETED";

      await updateDoc(doc(db, "syncRuns", syncRunRef.id), {
        completedAt: new Date().toISOString(),
        status: finalStatus,
        totalCount: activeRegs.length,
        changedCount,
        unchangedCount,
        successCount,
        failedCount,
      });

      return {
        syncRunId: syncRunRef.id,
        status: finalStatus,
        totalCount: activeRegs.length,
        changedCount,
        failedCount,
        elapsedMs: Date.now() - runStartMs,
      };
    } catch (err: any) {
      console.error("SyncRun fatal error", err);
      await updateDoc(doc(db, "syncRuns", syncRunRef.id), {
        completedAt: new Date().toISOString(),
        status: "FAILED",
        errorSummary: err?.message || "Unknown error",
      }).catch((e) => console.error("Failed updating SyncRun error state:", e));
      throw err;
    }
  }
}
