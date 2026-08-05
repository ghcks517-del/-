import { Router } from "express";
import { getDb } from "../firebase.js";
import { collection, query, orderBy, getDocs, doc, deleteDoc } from "firebase/firestore";

export function setupLegislativeNoticeRoutes(router: Router) {
    router.post("/legislative-notices/bulk-delete", async (req, res) => {
        try {
            const { ids } = req.body;
            if (!Array.isArray(ids)) {
                return res.status(400).json({ error: "Invalid ids array" });
            }
            const db = getDb();
            // Firebase client SDK doesn't easily expose bulk write without writeBatch if we're just using basic functions,
            // but we can just use deleteDoc in a loop with Promise.all
            await Promise.all(ids.map(id => deleteDoc(doc(db, "legislativeNotices", id))));
            res.json({ success: true });
        } catch (error) {
            console.error("Error bulk deleting legislative notices:", error);
            res.status(500).json({ error: "Failed to bulk delete legislative notices" });
        }
    });

    router.get("/legislative-notices", async (req, res) => {
        try {
            const db = getDb();
            const q = query(collection(db, "legislativeNotices"), orderBy("startDate", "desc"));
            const snapshot = await getDocs(q);
            const notices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            res.json(notices);
        } catch (error) {
            console.error("Error fetching legislative notices:", error);
            res.status(500).json({ error: "Failed to fetch legislative notices" });
        }
    });

    router.delete("/legislative-notices/:id", async (req, res) => {
        try {
            const db = getDb();
            const docRef = doc(db, "legislativeNotices", req.params.id);
            await deleteDoc(docRef);
            res.json({ success: true });
        } catch (error) {
            console.error("Error deleting legislative notice:", error);
            res.status(500).json({ error: "Failed to delete legislative notice" });
        }
    });
}
