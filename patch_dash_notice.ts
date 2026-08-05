import fs from 'fs';
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

const targetNoticeFilter = `          noticesData = allNotices.filter((notice: any) => {
             const dateStr = notice.startDate; // 입법예고는 startDate 기준
             if (!dateStr) return false;
             const [y, m, d] = dateStr.split("-");
             if (exportYear !== "ALL" && y !== String(exportYear)) return false;
             if (exportMonth !== "ALL" && parseInt(m, 10) !== exportMonth) return false;
             return true;
          });`;

const replNoticeFilter = `          noticesData = allNotices.filter((notice: any) => {
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
             if (exportYear !== "ALL" && y !== String(exportYear)) return false;
             if (exportMonth !== "ALL" && parseInt(m, 10) !== exportMonth) return false;
             return true;
          });`;

content = content.replace(targetNoticeFilter, replNoticeFilter);
fs.writeFileSync('src/pages/Dashboard.tsx', content);
