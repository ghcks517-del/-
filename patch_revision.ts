import fs from 'fs';
let content = fs.readFileSync('src/pages/RevisionHistory.tsx', 'utf-8');

// handleExport logic 
const handleExportCode = `  const handleExport = () => {
    const selectedRevisions = revisions.filter(r => selectedItems.has(r.id));
    if (selectedRevisions.length === 0) {
      alert("다운로드할 항목을 선택해주세요.");
      return;
    }
    ExcelExportService.exportRevisions(selectedRevisions);
  };`;
content = content.replace(handleExportCode, '');

// The export button
const exportButtonCode = `            <button onClick={handleExport} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-50 transition-colors flex items-center gap-2 font-medium text-sm shadow-sm">
              <Download className="w-4 h-4" />
              엑셀 다운로드
            </button>`;
content = content.replace(exportButtonCode, '');

fs.writeFileSync('src/pages/RevisionHistory.tsx', content);
