import fs from 'fs';

const content = fs.readFileSync('src/services/ExcelExportService.ts', 'utf-8');
const newContent = `import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { Revision } from "../types";

export class ExcelExportService {
  static async exportRevisions(revisions: Revision[], filenamePrefix = "법규개정현황") {
    if (!revisions || revisions.length === 0) {
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
    titleCell.value = \`\${currentYear}년 \${currentMonth}월 안전환경 법규 제/개정 및 대응방안\`;
    titleCell.font = { bold: true, size: 20, color: { argb: "FF0000FF" } }; // 파란색
    titleCell.alignment = { vertical: "middle", horizontal: "left" };
    worksheet.getRow(1).height = 40;

    // 2. 작성 정보 (A2:I2)
    worksheet.mergeCells("A2:I2");
    const infoCell = worksheet.getCell("A2");
    const dateObj = new Date();
    const formattedDate = \`\${dateObj.getFullYear()}년 \${String(dateObj.getMonth() + 1).padStart(2, '0')}월 \${String(dateObj.getDate()).padStart(2, '0')}일\`;
    infoCell.value = \`작성부서 : 안전환경팀      작성자 : 관리자      작성일 : \${formattedDate}\`;
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

      // 대략적인 줄 수 계산 (명시적인 개행 + 글자수에 따른 자동 줄바꿈 고려)
      const calcLines = (text: string, width: number) => {
          if (!text) return 1;
          const lines = text.split('\\n');
          let totalLines = 0;
          lines.forEach(line => {
              totalLines += Math.max(1, Math.ceil(line.length / (width * 0.7))); // 한글 보정
          });
          return totalLines;
      };

      // 컬럼 폭 약 55
      const beforeLines = calcLines(beforeText, 55); 
      const afterLines = calcLines(afterText, 55);
      const maxLines = Math.max(beforeLines, afterLines, 1);
      
      // 엑셀 최대 행 높이 한계(약 409 포인트) 고려
      const rowsToSpan = Math.max(1, Math.ceil(maxLines / 27));
      const heightPerRow = Math.min(409, Math.ceil((maxLines * 15) / rowsToSpan) + 15); // 패딩 고려

      // 임시 부처 맵핑
      let agency = "-";
      if (rev.lawName.includes("환경") || rev.lawName.includes("폐기물") || rev.lawName.includes("수도")) agency = "기후에너지환경부";
      else if (rev.lawName.includes("가스") || rev.lawName.includes("에너지") || rev.lawName.includes("전기")) agency = "산업통상자원부";
      else if (rev.lawName.includes("소방") || rev.lawName.includes("화재") || rev.lawName.includes("위험물")) agency = "소방청";
      else if (rev.lawName.includes("건설")) agency = "국토교통부";
      else if (rev.lawName.includes("안전보건") || rev.lawName.includes("산업안전")) agency = "고용노동부";

      worksheet.getCell(currentRowIdx, 1).value = rev.lawName;
      worksheet.getCell(currentRowIdx, 2).value = rev.revisionType || "일부개정";
      worksheet.getCell(currentRowIdx, 3).value = agency;
      worksheet.getCell(currentRowIdx, 4).value = rev.promulgationDate || "-";
      worksheet.getCell(currentRowIdx, 5).value = rev.enforcementDate || "-";
      worksheet.getCell(currentRowIdx, 6).value = beforeText;
      worksheet.getCell(currentRowIdx, 7).value = afterText;
      worksheet.getCell(currentRowIdx, 8).value = rev.departments?.length > 0 ? rev.departments.join(", ") : "N/A";
      worksheet.getCell(currentRowIdx, 9).value = rev.note || "해당 없음\\n(정부 책무)";

      // 병합 처리
      if (rowsToSpan > 1) {
         for (let col = 1; col <= 9; col++) {
             worksheet.mergeCells(currentRowIdx, col, currentRowIdx + rowsToSpan - 1, col);
         }
      }

      // 스타일 적용 (병합된 전체 범위에 적용해야 테두리가 제대로 나옴)
      for (let r = currentRowIdx; r < currentRowIdx + rowsToSpan; r++) {
         const targetRow = worksheet.getRow(r);
         targetRow.height = heightPerRow; // 행 높이 지정
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
    const fileName = \`\${filenamePrefix}_\${today}.xlsx\`;
    
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, fileName);
  }

  // Prevent formula injection
  private static sanitizeInput(text: string | null | undefined): string {
    if (!text) return "";
    const str = String(text);
    if (/^[=+\\-@]/.test(str)) {
      return \`'\${str}\`;
    }
    return str;
  }
}
`
fs.writeFileSync('src/services/ExcelExportService.ts', newContent);
console.log("Patched!");
