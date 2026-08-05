import fs from 'fs';
let content = fs.readFileSync('src/services/ExcelExportService.ts', 'utf-8');

const targetDate = `          worksheet.getCell(currentRowIdx, 4).value = rev.promulgationDate ? rev.promulgationDate.replace(/-/g, '.') : "-";
          worksheet.getCell(currentRowIdx, 5).value = rev.enforcementDate ? rev.enforcementDate.replace(/-/g, '.') : "-";`;

const replDate = `          const formatDate = (dateStr: string | null) => {
              if (!dateStr) return "-";
              if (dateStr.includes("-")) return dateStr.replace(/-/g, '.');
              if (dateStr.length === 8) return \`\${dateStr.substring(0,4)}.\${dateStr.substring(4,6)}.\${dateStr.substring(6,8)}\`;
              return dateStr;
          };
          
          worksheet.getCell(currentRowIdx, 4).value = formatDate(rev.promulgationDate);
          worksheet.getCell(currentRowIdx, 5).value = formatDate(rev.enforcementDate);`;

content = content.replace(targetDate, replDate);
fs.writeFileSync('src/services/ExcelExportService.ts', content);
