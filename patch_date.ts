import fs from 'fs';
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

const targetRevFilter = `          revisionsData = allRevs.filter((rev: any) => {
             const dateStr = rev.promulgationDate;
             if (!dateStr) return false;
             const [y, m, d] = dateStr.split("-");
             if (exportYear !== "ALL" && y !== String(exportYear)) return false;
             if (exportMonth !== "ALL" && parseInt(m, 10) !== exportMonth) return false;
             return true;
          });`;

const replRevFilter = `          revisionsData = allRevs.filter((rev: any) => {
             const dateStr = rev.promulgationDate;
             if (!dateStr) return false;
             let y, m;
             if (dateStr.includes("-")) {
                 [y, m] = dateStr.split("-");
             } else if (dateStr.length === 8) {
                 y = dateStr.substring(0, 4);
                 m = dateStr.substring(4, 6);
             } else {
                 return false;
             }
             if (exportYear !== "ALL" && y !== String(exportYear)) return false;
             if (exportMonth !== "ALL" && parseInt(m, 10) !== exportMonth) return false;
             return true;
          });`;

content = content.replace(targetRevFilter, replRevFilter);
fs.writeFileSync('src/pages/Dashboard.tsx', content);

let revContent = fs.readFileSync('src/pages/RevisionHistory.tsx', 'utf-8');
const targetHistFilter = `    if (selectedYear !== "ALL" || selectedMonth !== "ALL") {
       const dateStr = rev.promulgationDate;
       if (!dateStr) return false;
       const [y, m, d] = dateStr.split("-");
       if (selectedYear !== "ALL" && y !== String(selectedYear)) return false;
       if (selectedMonth !== "ALL" && parseInt(m, 10) !== selectedMonth) return false;
    }`;

const replHistFilter = `    if (selectedYear !== "ALL" || selectedMonth !== "ALL") {
       const dateStr = rev.promulgationDate;
       if (!dateStr) return false;
       let y, m;
       if (dateStr.includes("-")) {
           [y, m] = dateStr.split("-");
       } else if (dateStr.length === 8) {
           y = dateStr.substring(0, 4);
           m = dateStr.substring(4, 6);
       } else {
           return false;
       }
       if (selectedYear !== "ALL" && y !== String(selectedYear)) return false;
       if (selectedMonth !== "ALL" && parseInt(m, 10) !== selectedMonth) return false;
    }`;
    
revContent = revContent.replace(targetHistFilter, replHistFilter);
fs.writeFileSync('src/pages/RevisionHistory.tsx', revContent);
