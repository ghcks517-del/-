import { Router } from "express";
import { getDb } from "../firebase.js";
import { collection, doc, getDocs, updateDoc, query, orderBy, deleteDoc, writeBatch } from "firebase/firestore";
import { GoogleGenAI } from "@google/genai";

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

    router.post("/revisions/compare", async (req, res) => {
        try {
            const { lawName, promulgationDate, enforcementDate, currentText } = req.body;
            
            if (!process.env.GEMINI_API_KEY) {
                return res.status(500).json({ error: "GEMINI_API_KEY가 설정되지 않았습니다." });
            }

            const ai = new GoogleGenAI({
                apiKey: process.env.GEMINI_API_KEY,
                httpOptions: {
                    headers: { 'User-Agent': 'aistudio-build' }
                }
            });
            
            const prompt = `다음은 최근 개정된 '${lawName}'의 본문 내용입니다. 
해당 법령의 공포일자는 ${promulgationDate}, 시행일자는 ${enforcementDate} 입니다.
개정 전/후 비교표를 Markdown 형태로 작성해주세요. OpenAPI에서 개정 전 데이터가 제한적이므로, 본문을 바탕으로 주요 변경 사항이나 핵심 내용을 요약하여 작성해 주세요.
반드시 마크다운 문서의 시작 부분에 공포일자와 시행일자를 안내문으로 적어주세요.
출력 형식은 다음의 컬럼을 포함하는 Markdown 표로 작성해 주세요:
| 구분(조문명) | 기존 내용(추정 또는 요약) | 개정 내용 | 변경 의도 및 비고 |

본문:
${currentText}`;

            const response = await ai.models.generateContent({
                model: "gemini-3.6-flash",
                contents: prompt,
            });

            res.json({ comparisonTable: response.text });
        } catch (error) {
            console.error("AI 비교표 생성 오류:", error);
            res.status(500).json({ error: "AI 비교표 생성에 실패했습니다." });
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
            res.json({ success: true });
        } catch (error) {
            console.error("Error updating revision:", error);
            res.status(500).json({ error: "Failed to update revision" });
        }
    });
}
