import { LawApiClient } from "./LawApiClient.js";
import { RegulationRepository } from "../repositories.js";
import { getDb } from "../firebase.js";
import { collection, addDoc, doc, writeBatch } from "firebase/firestore";
import { summarizeRevision } from "../gemini.js";
import { SyncRun, SyncRunItem, Revision } from "../../src/types/index.js";

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
                diffData: "",
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
