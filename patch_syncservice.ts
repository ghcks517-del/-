import fs from 'fs';
let content = fs.readFileSync('server/services/SyncService.ts', 'utf-8');

const importAdd = `import { summarizeRevision } from "../gemini.js";
import { SyncRun, SyncRunItem, Revision, LegislativeNotice } from "../../src/types/index.js";`;

content = content.replace(`import { SyncRun, SyncRunItem, Revision } from "../../src/types/index.js";`, importAdd);

const targetMethod = `      // Update SyncRun final status
      const finalStatus = failedCount > 0 ? (successCount > 0 ? "PARTIAL_SUCCESS" : "FAILED") : "COMPLETED";
      
      const dbSyncRunRef = doc(db, "syncRuns", syncRunRef.id);
      await writeBatch(db).update(dbSyncRunRef, {`;

const replMethod = `      // ===== 수집: 입법예고 (MOCK DATA) =====
      try {
        const yyyy = targetYear || new Date().getFullYear();
        const mm = String(targetMonth || (new Date().getMonth() + 1)).padStart(2, "0");
        const startDatePrefix = \`\${yyyy}-\${mm}\`;
        
        // 목업 데이터 생성 (실제 환경에서는 API 호출)
        const mockNotices = [
          {
            noticeId: \`notice-\${yyyy}\${mm}-01\`,
            title: \`산업안전보건법 일부개정법률안 입법예고 (Mock \${yyyy}-\${mm})\`,
            department: "고용노동부",
            startDate: \`\${startDatePrefix}-05\`,
            endDate: \`\${startDatePrefix}-25\`,
            content: "중대재해 예방을 위한 사업주 의무 강화 및 과태료 기준 상향 조정 등에 관한 입법예고",
            status: "진행중",
            sourceUrl: "https://www.lawmaking.go.kr/",
            collectedAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
          },
          {
            noticeId: \`notice-\${yyyy}\${mm}-02\`,
            title: \`화학물질관리법 시행령 일부개정령안 입법예고 (Mock \${yyyy}-\${mm})\`,
            department: "환경부",
            startDate: \`\${startDatePrefix}-10\`,
            endDate: \`\${startDatePrefix}-30\`,
            content: "유해화학물질 취급 기준 명확화 및 관리자 교육 이수 의무 시간 확대",
            status: "진행중",
            sourceUrl: "https://www.lawmaking.go.kr/",
            collectedAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
          }
        ];
        
        const batch = writeBatch(db);
        for (const notice of mockNotices) {
          const docRef = doc(collection(db, "legislativeNotices"));
          batch.set(docRef, notice);
        }
        await batch.commit();
        console.log(\`입법예고 \${mockNotices.length}건 수집 완료\`);
      } catch (noticeErr) {
        console.error("입법예고 수집 중 오류:", noticeErr);
      }

      // Update SyncRun final status
      const finalStatus = failedCount > 0 ? (successCount > 0 ? "PARTIAL_SUCCESS" : "FAILED") : "COMPLETED";
      
      const dbSyncRunRef = doc(db, "syncRuns", syncRunRef.id);
      await writeBatch(db).update(dbSyncRunRef, {`;

content = content.replace(targetMethod, replMethod);
fs.writeFileSync('server/services/SyncService.ts', content);
