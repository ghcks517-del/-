import fs from 'fs';
let content = fs.readFileSync('server/routes/revisions.ts', 'utf-8');

content = content.replace(`            if (aiSummary) {
                await updateDoc(docRef, { aiSummary });
                res.json({ success: true, aiSummary });
            } else {
                res.status(500).json({ error: "AI 분석 생성 실패" });
            }
            res.json({ success: true });`, `            if (aiSummary) {
                await updateDoc(docRef, { aiSummary });
                return res.json({ success: true, aiSummary });
            } else {
                return res.status(500).json({ error: "AI 분석 생성 실패" });
            }`);

fs.writeFileSync('server/routes/revisions.ts', content);
