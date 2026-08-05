import fs from 'fs';
let content = fs.readFileSync('server/routes/legislativeNotices.ts', 'utf-8');

const newRoute = `
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
`;

content = content.replace("export function setupLegislativeNoticeRoutes(router: Router) {", "export function setupLegislativeNoticeRoutes(router: Router) {" + newRoute);

fs.writeFileSync('server/routes/legislativeNotices.ts', content);
