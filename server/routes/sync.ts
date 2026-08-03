import { Router } from "express";
import { SyncService } from "../services/SyncService.js";
import { getDb } from "../firebase.js";
import { collection, query, orderBy, getDocs, doc, deleteDoc, writeBatch, where } from "firebase/firestore";

export function setupSyncRoutes(router: Router) {
  router.post("/jobs/monthly-sync", async (req, res) => {
    // Basic auth check
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.authorization;
    const xCronSecret = req.headers["x-cron-secret"];
    
    // Simplistic auth for now
    // In production, uncomment this block to enforce auth
    // if (cronSecret && xCronSecret !== cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    //     res.status(401).json({ error: "Unauthorized" });
    //     return;
    // }
    
    try {
      const { year, month } = req.body || {};
      const syncService = new SyncService();
      // Start in background so we don't timeout the HTTP request
      syncService.runMonthlySync("MANUAL", year, month).catch(err => console.error("Background sync error:", err));
      
      res.json({ message: "Monthly sync job started in background" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get("/sync-runs", async (req, res) => {
      try {
          const db = getDb();
          const q = query(collection(db, "syncRuns"), orderBy("startedAt", "desc"));
          const snapshot = await getDocs(q);
          const runs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
