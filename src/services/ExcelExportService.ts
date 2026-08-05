import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import * as diff from "diff";
import { Revision } from "../types";

export class ExcelExportService {
  static async exportRevisions(revisions: any[], notices: any[] = [], filenamePrefix = "법규개정현황") {
    if ((!revisions || revisions.length === 0) && (!notices || notices.length === 0)) {
      alert("다운로드할 데이터가 없습니다.");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("개정현황", {
        views: [{ state: 'frozen', xSplit: 0, ySplit: 4 }] // 헤더 4행까지 고정
    });

    // 컬럼 정의 (총 9개)
    worksheet.columns = [
      { key: "lawName", width: 25 },        // A: 법규명
      { key: "revisionType", width: 12 },   // B: 개정구분
      { key: "agency", width: 15 },         // C: 소관부처
      { key: "promulgationDate", width: 15 },// D: 공포일
      { key: "enforcementDate", width: 15 }, // E: 시행일
      { key: "beforeText", width: 55 },      // F: 변경 전
      { key: "afterText", width: 55 },       // G: 변경 후
      { key: "departments", width: 15 },     // H: 해당부서
      { key: "note", width: 25 },            // I: 대응방안
    ];

    // 1. 타이틀 (A1:I1)
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    worksheet.mergeCells("A1:I1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = `${currentYear}년 ${currentMonth}월 안전환경 법규 제/개정 및 대응방안`;
    titleCell.font = { bold: true, size: 20, color: { argb: "FF0000FF" } }; // 파란색
    titleCell.alignment = { vertical: "middle", horizontal: "left" };
    worksheet.getRow(1).height = 40;

    // 2. 작성 정보 (A2:I2)
    worksheet.mergeCells("A2:I2");
    const infoCell = worksheet.getCell("A2");
    const dateObj = new Date();
    const formattedDate = `${dateObj.getFullYear()}년 ${String(dateObj.getMonth() + 1).padStart(2, '0')}월 ${String(dateObj.getDate()).padStart(2, '0')}일`;
    infoCell.value = `작성부서 : 창원안전환경팀      작성자 : 양기정 과장, 문호찬 대리      작성일 : ${formattedDate}`;
    infoCell.font = { size: 10 };
    infoCell.alignment = { vertical: "middle", horizontal: "left" };
    worksheet.getRow(2).height = 20;

    // 3. 헤더 (A3:I4)
    worksheet.mergeCells("A3:A4"); worksheet.getCell("A3").value = "법규명";
    worksheet.mergeCells("B3:B4"); worksheet.getCell("B3").value = "개정구분";
    worksheet.mergeCells("C3:C4"); worksheet.getCell("C3").value = "소관부처";
    worksheet.mergeCells("D3:D4"); worksheet.getCell("D3").value = "공포일";
    worksheet.mergeCells("E3:E4"); worksheet.getCell("E3").value = "시행일";
    
    worksheet.mergeCells("F3:G3"); worksheet.getCell("F3").value = "제·개정 법규내용";
    worksheet.getCell("F4").value = "변경 전";
    worksheet.getCell("G4").value = "변경 후";
    
    worksheet.mergeCells("H3:H4"); worksheet.getCell("H3").value = "해당부서";
    worksheet.mergeCells("I3:I4"); worksheet.getCell("I3").value = "대응방안";

    // 헤더 스타일 적용
    const headerStyle = {
      font: { bold: true, size: 11, color: { argb: "FF000000" } },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9D9D9" } },
      alignment: { vertical: "middle", horizontal: "center", wrapText: true },
      border: {
        top: { style: "thin" }, left: { style: "thin" },
        bottom: { style: "thin" }, right: { style: "thin" }
      }
    } as const;

    for (let r = 3; r <= 4; r++) {
      for (let c = 1; c <= 9; c++) {
        const cell = worksheet.getCell(r, c);
        cell.font = headerStyle.font;
        cell.fill = headerStyle.fill as ExcelJS.Fill;
        cell.alignment = headerStyle.alignment as ExcelJS.Alignment;
        cell.border = headerStyle.border as ExcelJS.Borders;
      }
    }

    // 데이터 삽입
    let currentRowIdx = 5;

    revisions.forEach((rev) => {
      const beforeText = this.sanitizeInput(rev.beforeText);
      const afterText = this.sanitizeInput(rev.afterText);

      const splitIntoParagraphs = (text: string) => {
          if (!text) return [];
          let t = text.replace(/\r/g, '');
          let blocks: string[] = [];
          
          const lines = t.split('\n');
          let currentBlock = "";
          
          for (const line of lines) {
              // 제O조, 제O조의O, 부칙, [별표] 등으로 시작하는지 확인
              const isNewSection = /^\s*(제\d+조(?:의\d+)?|부칙|\[별표)/.test(line);
              if (isNewSection) {
                  if (currentBlock) blocks.push(currentBlock.trim());
                  currentBlock = line;
              } else {
                  if (currentBlock) {
                      currentBlock += '\n' + line;
                  } else {
                      currentBlock = line;
                  }
              }
          }
          if (currentBlock) blocks.push(currentBlock.trim());
          
          return blocks;
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
              const lines = text.split('\n');
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
          const formatDate = (dateStr: string | null) => {
              if (!dateStr) return "-";
              if (dateStr.includes("-")) return dateStr.replace(/-/g, '.');
              if (dateStr.length === 8) return `${dateStr.substring(0,4)}.${dateStr.substring(4,6)}.${dateStr.substring(6,8)}`;
              return dateStr;
          };
          
          worksheet.getCell(currentRowIdx, 4).value = formatDate(rev.promulgationDate);
          worksheet.getCell(currentRowIdx, 5).value = formatDate(rev.enforcementDate);

          const lineDiffs = diff.diffLines(bText, aText);
          const beforeRichText: any[] = [];
          const afterRichText: any[] = [];

          let pendingRemoved: diff.Change | null = null;
          let pendingAdded: diff.Change | null = null;

          const flush = () => {
            if (pendingRemoved || pendingAdded) {
              const bPart = pendingRemoved ? pendingRemoved.value.replace(/\n$/, '') : "";
              const aPart = pendingAdded ? pendingAdded.value.replace(/\n$/, '') : "";

              const wordDiffs = diff.diffWordsWithSpace(bPart, aPart);
              
              if (bPart) {
                wordDiffs.forEach(part => {
                  if (part.added) return;
                  beforeRichText.push({
                    text: part.value,
                    font: part.removed ? { color: { argb: "FFe11d48" } } : undefined
                  });
                });
                beforeRichText.push({ text: '\n' });
              } else if (pendingRemoved) { 
                 beforeRichText.push({ text: '<신 설>\n', font: { color: { argb: "FFe11d48" } } });
              }

              if (aPart) {
                wordDiffs.forEach(part => {
                  if (part.removed) return;
                  afterRichText.push({
                    text: part.value,
                    font: part.added ? { color: { argb: "FF2563eb" } } : undefined
                  });
                });
                afterRichText.push({ text: '\n' });
              } else if (pendingAdded) {
                afterRichText.push({ text: '<삭 제>\n', font: { color: { argb: "FF5a6e85" } } });
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
              const lines = part.value.split('\n');
              beforeRichText.push({ text: part.value });
              afterRichText.push({ text: part.value });
            }
          });
          flush();

          const cleanupRichText = (rt: any[]) => {
              if (rt.length > 0 && rt[rt.length - 1].text === '\n') {
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
          worksheet.getCell(currentRowIdx, 9).value = rev.note || "해당 없음\n(정부 책무)";

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
    });

    // 입법예고 추가
    notices.forEach((notice) => {
        const title = this.sanitizeInput(notice.title);
        const content = this.sanitizeInput(notice.content);
        const startDate = notice.startDate ? notice.startDate.replace(/-/g, '.') : "-";
        const endDate = notice.endDate ? notice.endDate.replace(/-/g, '.') : "-";
        
        // 엑셀 최대 행 높이 한계 고려
        const calcLines = (text: string, width: number) => {
            if (!text) return 1;
            const lines = text.split('\n');
            let totalLines = 0;
            lines.forEach(line => {
                totalLines += Math.max(1, Math.ceil(line.length / (width * 0.7)));
            });
            return totalLines;
        };
        const contentLines = calcLines(content, 55);
        const rowsToSpan = Math.max(1, Math.ceil(contentLines / 27));
        const heightPerRow = Math.min(409, Math.ceil((contentLines * 15) / rowsToSpan) + 15);

        worksheet.getCell(currentRowIdx, 1).value = title;
        worksheet.getCell(currentRowIdx, 2).value = "입법예고";
        worksheet.getCell(currentRowIdx, 3).value = notice.department || "-";
        worksheet.getCell(currentRowIdx, 4).value = startDate;
        worksheet.getCell(currentRowIdx, 5).value = endDate;
        
        worksheet.getCell(currentRowIdx, 6).value = ""; // 변경 전 (입법예고에는 명확한 before가 없을 수 있음)
        worksheet.getCell(currentRowIdx, 7).value = content;
        
        worksheet.getCell(currentRowIdx, 8).value = "-";
        worksheet.getCell(currentRowIdx, 9).value = notice.status || "-";

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
    });

    // 파일 생성 및 다운로드
    const buffer = await workbook.xlsx.writeBuffer();
    const today = new Date().toISOString().split("T")[0];
    const fileName = `${filenamePrefix}_${today}.xlsx`;
    
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, fileName);
  }

  // Prevent formula injection
  private static sanitizeInput(text: string | null | undefined): string {
    if (!text) return "";
    const str = String(text);
    if (/^[=+\-@]/.test(str)) {
      return `'${str}`;
    }
    return str;
  }
}
