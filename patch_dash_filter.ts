import fs from 'fs';
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

const filterCodeTarget = `      if (exportRevisions) {
        const revRes = await fetch(\`/api/revisions\${queryParams}\`);
        if (revRes.ok) {
          revisionsData = await revRes.json();
        }
      }

      if (exportNotices) {
        const notRes = await fetch(\`/api/legislative-notices\${queryParams}\`);
        if (notRes.ok) {
          noticesData = await notRes.json();
        }
      }`;

const filterCodeRepl = `      if (exportRevisions) {
        const revRes = await fetch(\`/api/revisions\`);
        if (revRes.ok) {
          const allRevs = await revRes.json();
          revisionsData = allRevs.filter((rev: any) => {
             const dateStr = rev.promulgationDate;
             if (!dateStr) return false;
             const [y, m, d] = dateStr.split("-");
             if (exportYear !== "ALL" && y !== String(exportYear)) return false;
             if (exportMonth !== "ALL" && parseInt(m, 10) !== exportMonth) return false;
             return true;
          });
        }
      }

      if (exportNotices) {
        const notRes = await fetch(\`/api/legislative-notices\`);
        if (notRes.ok) {
          const allNotices = await notRes.json();
          noticesData = allNotices.filter((notice: any) => {
             const dateStr = notice.startDate; // 입법예고는 startDate 기준
             if (!dateStr) return false;
             const [y, m, d] = dateStr.split("-");
             if (exportYear !== "ALL" && y !== String(exportYear)) return false;
             if (exportMonth !== "ALL" && parseInt(m, 10) !== exportMonth) return false;
             return true;
          });
        }
      }`;

content = content.replace(filterCodeTarget, filterCodeRepl);
fs.writeFileSync('src/pages/Dashboard.tsx', content);
