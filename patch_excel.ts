import fs from 'fs';
let content = fs.readFileSync('src/services/ExcelExportService.ts', 'utf-8');

const targetLoopStart = `    revisions.forEach((rev) => {
      const beforeText = this.sanitizeInput(rev.beforeText);
      const afterText = this.sanitizeInput(rev.afterText);`;

const targetLoopEnd = `      currentRowIdx += rowsToSpan;
    });`;

const targetLoopBodyStr = content.substring(content.indexOf(targetLoopStart), content.indexOf(targetLoopEnd) + targetLoopEnd.length);

const replacementLoopBody = `    revisions.forEach((rev) => {
      const beforeText = this.sanitizeInput(rev.beforeText);
      const afterText = this.sanitizeInput(rev.afterText);

      const splitIntoParagraphs = (text: string) => {
        if (!text) return [];
        let t = text.replace(/\\r/g, '');
        if (t.includes('\\n\\n')) {
            return t.split(/\\n\\n+/).map(s => s.trim()).filter(Boolean);
        }
        t = t.replace(/\\n(?=\\s*(제\\d+조|제\\d+항|①|②|③|④|⑤|⑥|⑦|⑧|⑨|⑩|1\\.|2\\.|3\\.|4\\.|가\\.|나\\.|다\\.|라\\.)\\s)/g, '\\n\\n');
        return t.split(/\\n\\n+/).map(s => s.trim()).filter(Boolean);
      };

      let beforeSections = splitIntoParagraphs(beforeText);
      let afterSections = splitIntoParagraphs(afterText);
      
      if (beforeSections.length === 0 && afterSections.length === 0) {
          beforeSections = [""];
          afterSections = [""];
      }
      
      const maxSections = Math.max(beforeSections.length, afterSections.length, 1);

      let agency = "-";
      if (rev.lawName.includes("기본법 시행령") || rev.lawName.includes("탄소중립")) agency = "기후에너지환경부";
      else if (rev.lawName.includes("환경") || rev.lawName.includes("폐기물") || rev.lawName.includes("수도")) agency = "환경부";
      else if (rev.lawName.includes("가스") || rev.lawName.includes("에너지") || rev.lawName.includes("전기")) agency = "산업통상자원부";
      else if (rev.lawName.includes("소방") || rev.lawName.includes("화재") || rev.lawName.includes("위험물")) agency = "소방청";
      else if (rev.lawName.includes("건설")) agency = "국토교통부";
      else if (rev.lawName.includes("안전보건") || rev.lawName.includes("산업안전")) agency = "고용노동부";

      for (let i = 0; i < maxSections; i++) {
          const bText = beforeSections[i] || "";
          const aText = afterSections[i] || "";
          
          const calcLines = (text: string, width: number) => {
              if (!text) return 1;
              const lines = text.split('\\n');
              let totalLines = 0;
              lines.forEach(line => {
                  totalLines += Math.max(1, Math.ceil(line.length / (width * 0.7)));
              });
              return totalLines;
          };

          const beforeLines = calcLines(bText, 55); 
          const afterLines = calcLines(aText, 55);
          const maxLinesCount = Math.max(beforeLines, afterLines, 1);
          
          const rowsToSpan = Math.max(1, Math.ceil(maxLinesCount / 27));
          const heightPerRow = Math.min(409, Math.ceil((maxLinesCount * 15) / rowsToSpan) + 15);

          worksheet.getCell(currentRowIdx, 1).value = rev.lawName;
          worksheet.getCell(currentRowIdx, 2).value = rev.revisionType || "일부개정";
          worksheet.getCell(currentRowIdx, 3).value = agency;
          worksheet.getCell(currentRowIdx, 4).value = rev.promulgationDate ? rev.promulgationDate.replace(/-/g, '.') : "-";
          worksheet.getCell(currentRowIdx, 5).value = rev.enforcementDate ? rev.enforcementDate.replace(/-/g, '.') : "-";

          const lineDiffs = diff.diffLines(bText, aText);
          const beforeRichText: any[] = [];
          const afterRichText: any[] = [];

          let pendingRemoved: diff.Change | null = null;
          let pendingAdded: diff.Change | null = null;

          const flush = () => {
            if (pendingRemoved || pendingAdded) {
              const bPart = pendingRemoved ? pendingRemoved.value.replace(/\\n$/, '') : "";
              const aPart = pendingAdded ? pendingAdded.value.replace(/\\n$/, '') : "";

              const wordDiffs = diff.diffWordsWithSpace(bPart, aPart);
              
              if (bPart) {
                wordDiffs.forEach(part => {
                  if (part.added) return;
                  beforeRichText.push({
                    text: part.value,
                    font: part.removed ? { color: { argb: "FFe11d48" } } : undefined
                  });
                });
                beforeRichText.push({ text: '\\n' });
              } else if (pendingRemoved) { 
                 beforeRichText.push({ text: '<신 설>\\n', font: { color: { argb: "FFe11d48" } } });
              }

              if (aPart) {
                wordDiffs.forEach(part => {
                  if (part.removed) return;
                  afterRichText.push({
                    text: part.value,
                    font: part.added ? { color: { argb: "FF2563eb" } } : undefined
                  });
                });
                afterRichText.push({ text: '\\n' });
              } else if (pendingAdded) {
                afterRichText.push({ text: '<삭 제>\\n', font: { color: { argb: "FF5a6e85" } } });
              }

              pendingRemoved = null;
              pendingAdded = null;
            }
          };

          lineDiffs.forEach((part) => {
            if (part.added) {
              if (pendingAdded) flush();
              pendingAdded = part;
            } else if (part.removed) {
              if (pendingRemoved) flush();
              pendingRemoved = part;
            } else {
              flush();
              const lines = part.value.split('\\n');
              beforeRichText.push({ text: part.value });
              afterRichText.push({ text: part.value });
            }
          });
          flush();

          const cleanupRichText = (rt: any[]) => {
              if (rt.length > 0 && rt[rt.length - 1].text === '\\n') {
                  rt.pop();
              }
              if (rt.length === 0) {
                 rt.push({ text: "" });
              }
              return { richText: rt };
          };

          worksheet.getCell(currentRowIdx, 6).value = cleanupRichText(beforeRichText);
          worksheet.getCell(currentRowIdx, 7).value = cleanupRichText(afterRichText);
          worksheet.getCell(currentRowIdx, 8).value = rev.departments?.length > 0 ? rev.departments.join(", ") : "N/A";
          worksheet.getCell(currentRowIdx, 9).value = rev.note || "해당 없음\\n(정부 책무)";

          if (rowsToSpan > 1) {
             for (let col = 1; col <= 9; col++) {
                 worksheet.mergeCells(currentRowIdx, col, currentRowIdx + rowsToSpan - 1, col);
             }
          }

          for (let r = currentRowIdx; r < currentRowIdx + rowsToSpan; r++) {
             const targetRow = worksheet.getRow(r);
             targetRow.height = heightPerRow; 
             for (let c = 1; c <= 9; c++) {
                 const cell = targetRow.getCell(c);
                 cell.alignment = { 
                     vertical: "top", 
                     horizontal: (c === 6 || c === 7 || c === 1) ? "left" : "center",
                     wrapText: true 
                 };
                 cell.border = {
                     top: { style: "thin", color: { argb: "FF000000" } },
                     left: { style: "thin", color: { argb: "FF000000" } },
                     bottom: { style: "thin", color: { argb: "FF000000" } },
                     right: { style: "thin", color: { argb: "FF000000" } }
                 };
             }
          }

          currentRowIdx += rowsToSpan;
      }
    });`;

let newContent = content.replace(targetLoopBodyStr, replacementLoopBody);
fs.writeFileSync('src/services/ExcelExportService.ts', newContent);
