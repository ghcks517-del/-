import { Router } from "express";
import { getDb } from "../firebase.js";
import { collection, doc, getDocs, updateDoc, query, orderBy } from "firebase/firestore";

export function setupRevisionRoutes(router: Router) {
    router.get("/revisions", async (req, res) => {
        try {
            const db = getDb();
            const q = query(collection(db, "revisions"), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            const revisions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            res.json(revisions);
        } catch (error) {
            console.error("Error fetching revisions:", error);
            res.status(500).json({ error: "Failed to fetch revisions" });
        }
    });

    router.put("/revisions/:id", async (req, res) => {
        try {
            const db = getDb();
            const { id } = req.params;
            const { reviewStatus, note } = req.body;
            
            const docRef = doc(db, "revisions", id);
            
            const updateData: any = { updatedAt: new Date().toISOString() };
            if (reviewStatus !== undefined) updateData.reviewStatus = reviewStatus;
            if (note !== undefined) updateData.note = note;

            await updateDoc(docRef, updateData);
            res.json({ success: true });
        } catch (error) {
            console.error("Error updating revision:", error);
            res.status(500).json({ error: "Failed to update revision" });
        }
    });
}
