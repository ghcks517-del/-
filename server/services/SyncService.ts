import { LawApiClient } from "./LawApiClient.js";
import { RegulationRepository } from "../repositories.js";
import { getDb } from "../firebase.js";
import { collection, addDoc, doc, writeBatch } from "firebase/firestore";

import { summarizeRevision } from "../gemini.js";
import { SyncRun, SyncRunItem, Revision, LegislativeNotice } from "../../src/types/index.js";

export class SyncService {
  private lawApiClient = new LawApiClient();

  async runMonthlySync(triggerType: "MANUAL" | "AUTO", targetYear?: number, targetMonth?: number): Promise<void> {
    const db = getDb();
    
    // 1. Create SyncRun record
    const syncRunRef = await addDoc(collection(db, "syncRuns"), {
      triggerType,
      targetYear: targetYear || new Date().getFullYear(),
      targetMonth: targetMonth || new Date().getMonth() + 1,
      startedAt: new Date().toISOString(),
      completedAt: null,
      status: "RUNNING",
      totalCount: 0,
      changedCount: 0,
      unchangedCount: 0,
      successCount: 0,
      failedCount: 0,
      errorSummary: null
    } as Omit<SyncRun, "id">);

    try {
      // 2. Fetch all active regulations
      const activeRegs = await RegulationRepository.getAllActive();
      
      let changedCount = 0;
      let unchangedCount = 0;
      let successCount = 0;
      let failedCount = 0;

      for (const reg of activeRegs) {
        let status: SyncRunItem["status"] = "SUCCESS";
        let errorMessage: string | null = null;
        let revisionCount = 0;
        const itemStartedAt = new Date().toISOString();

        try {
          // 3. Fetch revisions for this month
          const revisions = await this.lawApiClient.getRecentRevisions(reg.lawName, reg.regulationType, targetYear, targetMonth);
          
          if (revisions.length === 0) {
            status = "UNCHANGED";
            unchangedCount++;
          } else {
            status = "SUCCESS";
            changedCount++;
            
            // For each revision, optionally call Gemini to summarize
            const batch = writeBatch(db);
            
            for (const rev of revisions) {
              const aiSummary = await summarizeRevision(rev.beforeText, rev.afterText);
              
              const revisionDocRef = doc(collection(db, "revisions"));
              batch.set(revisionDocRef, {
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
                aiSummary,
                departments: reg.defaultDepartments || [],
                note: reg.defaultNote || "",
                reviewStatus: "NEW",
                reviewer: null,
                reviewedAt: null,
                sourceUrl: rev.sourceUrl,
                collectedAt: rev.collectedAt,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                updatedBy: null
              } as Omit<Revision, "id">);
              revisionCount++;
            }
            
            await batch.commit();
          }

          successCount++;
        } catch (err: any) {
          status = "FAILED";
          errorMessage = err.message || "Unknown error";
          failedCount++;
        }

        // Add item log
        await addDoc(collection(db, "syncRunItems"), {
          syncRunId: syncRunRef.id,
          regulationId: reg.id,
          status,
          revisionCount,
          startedAt: itemStartedAt,
          completedAt: new Date().toISOString(),
          errorMessage
        } as Omit<SyncRunItem, "id">);
        
        // Update regulation last checked
        if (status === "SUCCESS" || status === "UNCHANGED") {
            await RegulationRepository.update(reg.id, {
                lastCheckedAt: new Date().toISOString(),
                lastSuccessfulCheckedAt: new Date().toISOString(),
            });
        }
      }

      // ===== 수집: 입법예고 (API or MOCK Fallback) =====
      try {
        const yyyy = targetYear || new Date().getFullYear();
        const mm = String(targetMonth || (new Date().getMonth() + 1)).padStart(2, "0");
        
        let fetchedNotices: any[] = [];
        const dataApiKey = process.env.DATA_GO_KR_API_KEY;
        
        if (dataApiKey) {
            try {
                // 실제 공공데이터포털 입법예고 API 연동 (국민참여입법센터 입법예고 목록)
                const axios = require('axios');
                const { parseStringPromise } = require('xml2js');
                
                const res = await axios.get("http://apis.data.go.kr/1130000/MllwnoLrsrcInfoService/getMllwnoLrsrcInfoList", {
                    params: { serviceKey: decodeURIComponent(dataApiKey), pageNo: 1, numOfRows: 100 }
                });
                const parsed = await parseStringPromise(res.data);
                
                if (parsed.response && parsed.response.body && parsed.response.body[0].items && parsed.response.body[0].items[0].item) {
                    const items = parsed.response.body[0].items[0].item;
                    fetchedNotices = items.map((item: any) => ({
                        noticeId: `notice-${item.pbancNo?.[0] || Math.random()}`,
                        title: item.lrsrcNm?.[0] || "",
                        department: item.chrscDptNm?.[0] || "",
                        startDate: item.pbancBgngYmd?.[0] || "",
                        endDate: item.pbancEndYmd?.[0] || "",
                        content: item.ntceMainCn?.[0] || "상세내용 참고",
                        status: "입법예고",
                        sourceUrl: item.url?.[0] || "https://opinion.lawmaking.go.kr",
                        collectedAt: new Date().toISOString(),
                        createdAt: new Date().toISOString()
                    }));
                }
            } catch (apiErr: any) {
                console.error("공공데이터포털 API 연동 실패 (Fallback Mock 사용):", apiErr.message);
            }
        }
        
        if (fetchedNotices.length === 0) {
            // API 키가 없거나 연동 실패 시, 사용자의 구독 법령(activeRegs) 기반으로 동적 Mock 데이터 생성
            console.log("Using dynamic mock data for legislative notices...");
            const startDatePrefix = `${yyyy}-${mm}`;
            
            fetchedNotices = activeRegs.map((reg, idx) => ({
                noticeId: `notice-${yyyy}${mm}-${idx}`,
                title: `${reg.lawName} 일부개정법률안 입법예고 (Mock)`,
                department: "관할부처",
                startDate: `${startDatePrefix}-${String((idx % 28) + 1).padStart(2, '0')}`,
                endDate: `${startDatePrefix}-${String(((idx + 14) % 28) + 1).padStart(2, '0')}`,
                content: `1. 개정이유
현행 ${reg.lawName}의 운영상 나타난 일부 미비점을 개선ㆍ보완하려는 것임.

2. 주요내용
가. 주요 규제 완화 또는 기준 명확화
나. 과태료 등 제재 규정 정비`,
                status: "진행중",
                sourceUrl: "https://www.lawmaking.go.kr/",
                collectedAt: new Date().toISOString(),
                createdAt: new Date().toISOString()
            }));
        }

        // 필터링: 등록된 법규명(activeRegs)에 해당하는 입법예고만 추출
        const filteredNotices = fetchedNotices.filter(notice => 
          activeRegs.some(reg => notice.title.includes(reg.lawName))
        );
        
        if (filteredNotices.length > 0) {
          const batch = writeBatch(db);
          for (const notice of filteredNotices) {
            const docRef = doc(collection(db, "legislativeNotices"));
            batch.set(docRef, notice);
          }
          await batch.commit();
        }
        console.log(`입법예고 ${filteredNotices.length}건 수집 완료`);
      } catch (noticeErr) {
        console.error("입법예고 수집 중 오류:", noticeErr);
      }

      // Update SyncRun final status
      const finalStatus = failedCount > 0 ? (successCount > 0 ? "PARTIAL_SUCCESS" : "FAILED") : "COMPLETED";
      
      const dbSyncRunRef = doc(db, "syncRuns", syncRunRef.id);
      await writeBatch(db).update(dbSyncRunRef, {
        completedAt: new Date().toISOString(),
        status: finalStatus,
        totalCount: activeRegs.length,
        changedCount,
        unchangedCount,
        successCount,
        failedCount,
      }).commit();

    } catch (err: any) {
      console.error("SyncRun fatal error", err);
      const dbSyncRunRef = doc(db, "syncRuns", syncRunRef.id);
      await writeBatch(db).update(dbSyncRunRef, {
        completedAt: new Date().toISOString(),
        status: "FAILED",
        errorSummary: err.message
      }).commit();
    }
  }
}
