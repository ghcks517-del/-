import { Router } from "express";
import { getDb } from "../firebase.js";
import { collection, query, orderBy, getDocs, doc, deleteDoc } from "firebase/firestore";

export function setupLegislativeNoticeRoutes(router: Router) {
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
