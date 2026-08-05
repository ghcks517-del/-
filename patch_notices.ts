import fs from 'fs';
let content = fs.readFileSync('src/pages/LegislativeNoticeList.tsx', 'utf-8');
content = content.replace('if (y !== String(selectedYear)) return false;', 'if (selectedYear !== "ALL" && y !== String(selectedYear)) return false;');
fs.writeFileSync('src/pages/LegislativeNoticeList.tsx', content);
