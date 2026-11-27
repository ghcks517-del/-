import { Router } from "express";
import { SyncService } from "../services/SyncService.js";
import { getDb } from "../firebase.js";
import { collection, query, orderBy, getDocs, doc, updateDoc, writeBatch, where } from "firebase/firestore";

const STALE_RUNNING_MS = 3 * 60 * 1000; // 3 minutes

export function setupSyncRoutes(router: Router) {
  router.post("/jobs/monthly-sync", async (req, res) => {
    try {
      const { year, month } = req.body || {};
      const syncService = new SyncService();
      const result = await syncService.runMonthlySync("MANUAL", year, month);
      res.json({ message: "Monthly sync job completed", ...result });
    } catch (err: any) {
      console.error("Monthly sync failed:", err);
      res.status(500).json({ error: err?.message || "수집 실행 중 오류가 발생했습니다." });
    }
  });

  router.get("/sync-runs", async (req, res) => {
    try {
      const db = getDb();
      const q = query(collection(db, "syncRuns"), orderBy("startedAt", "desc"));
      const snapshot = await getDocs(q);
      const now = Date.now();

      const runs = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const startedMs = data.startedAt ? Date.parse(data.startedAt) : 0;

          // Recover zombie RUNNING entries that were killed by serverless timeout
          if (data.status === "RUNNING" && startedMs > 0 && now - startedMs > STALE_RUNNING_MS) {
            const completedAt = new Date().toISOString();
            const errorSummary = "서버 실행 시간 초과로 중단되었습니다. 다시 실행해 주세요.";
            await updateDoc(doc(db, "syncRuns", docSnap.id), {
              status: "FAILED",
              completedAt,
              errorSummary,
            }).catch(() => {});
            return {
              id: docSnap.id,
              ...data,
              status: "FAILED",
              completedAt,
              errorSummary,
            };
          }

          return { id: docSnap.id, ...data };
        })
      );

      res.json(runs);
    } catch (err: any) {
      console.error("Error fetching sync runs", err);
      res.status(500).json({ error: err.message });
    }
  });

  router.delete("/sync-runs/:id", async (req, res) => {
    try {
      const db = getDb();
      const q = query(collection(db, "syncRunItems"), where("syncRunId", "==", req.params.id));
      const itemsSnapshot = await getDocs(q);
      const batch = writeBatch(db);
      for (const docSnap of itemsSnapshot.docs) {
        batch.delete(docSnap.ref);
      }
      batch.delete(doc(db, "syncRuns", req.params.id));
      await batch.commit();
      res.json({ success: true });
    } catch (err: any) {
      console.error("Error deleting sync run", err);
      res.status(500).json({ error: err.message });
    }
  });
}
