import { Router } from "express";
import { getDb } from "../firebase.js";
import { collection, doc, getDocs, updateDoc, query, orderBy, deleteDoc, writeBatch } from "firebase/firestore";

export function setupRevisionRoutes(router: Router) {
    router.delete("/revisions", async (req, res) => {
        try {
            const db = getDb();
            const { ids } = req.body;
            if (!ids || !Array.isArray(ids)) {
                return res.status(400).json({ error: "Invalid request" });
            }
            
            const batch = writeBatch(db);
            for (const id of ids) {
                batch.delete(doc(db, "revisions", id));
            }
            await batch.commit();
            res.json({ success: true });
        } catch (error) {
            console.error("Error deleting revisions:", error);
            res.status(500).json({ error: "Failed to delete revisions" });
        }
    });

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
        } catch (error) {
            console.error("Error updating revision:", error);
            res.status(500).json({ error: "Failed to update revision" });
        }
    });

    router.post("/revisions/:id/analyze", async (req, res) => {
        try {
            const db = getDb();
            const { id } = req.params;
            const docRef = doc(db, "revisions", id);
            
            const docSnap = await getDocs(query(collection(db, "revisions")));
            const docData = docSnap.docs.find(d => d.id === id)?.data();
            
            if (!docData) {
                return res.status(404).json({ error: "Revision not found" });
            }

            const { summarizeRevision } = await import("../gemini.js");
            const aiSummary = await summarizeRevision(docData.beforeText, docData.afterText);

            if (aiSummary) {
                await updateDoc(docRef, { aiSummary });
                return res.json({ success: true, aiSummary });
            } else {
                return res.status(500).json({ error: "AI 분석 생성 실패" });
            }
        } catch (error) {
            console.error("Error updating revision:", error);
            res.status(500).json({ error: "Failed to update revision" });
        }
    });
}
