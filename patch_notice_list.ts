import fs from 'fs';
let content = fs.readFileSync('src/pages/LegislativeNoticeList.tsx', 'utf-8');

const targetListFilter = `    if (selectedYear !== "ALL" || selectedMonth !== "ALL") {
      const dateStr = notice.startDate;
      if (!dateStr) return false;
      const [y, m, d] = dateStr.split("-");
      if (selectedYear !== "ALL" && y !== String(selectedYear)) return false;
      if (selectedMonth !== "ALL" && parseInt(m, 10) !== selectedMonth) return false;
    }`;

const replListFilter = `    if (selectedYear !== "ALL" || selectedMonth !== "ALL") {
      const dateStr = notice.startDate;
      if (!dateStr) return false;
      let y, m;
      if (dateStr.includes("-")) {
          [y, m] = dateStr.split("-");
      } else if (dateStr.length >= 8) {
          y = dateStr.substring(0, 4);
          m = dateStr.substring(4, 6);
      } else {
          return false;
      }
      if (selectedYear !== "ALL" && y !== String(selectedYear)) return false;
      if (selectedMonth !== "ALL" && parseInt(m, 10) !== selectedMonth) return false;
    }`;

content = content.replace(targetListFilter, replListFilter);
fs.writeFileSync('src/pages/LegislativeNoticeList.tsx', content);
