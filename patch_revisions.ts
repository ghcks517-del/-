import fs from 'fs';
let content = fs.readFileSync('server/routes/revisions.ts', 'utf-8');

const targetStr = `            if (note !== undefined) updateData.note = note;

            await updateDoc(docRef, updateData);`;

const replStr = `            if (note !== undefined) updateData.note = note;

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
                res.json({ success: true, aiSummary });
            } else {
                res.status(500).json({ error: "AI 분석 생성 실패" });
            }`;

content = content.replace(targetStr, replStr);
fs.writeFileSync('server/routes/revisions.ts', content);
