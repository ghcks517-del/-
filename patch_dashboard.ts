import fs from 'fs';
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

const targetImports = 'import { Book, RefreshCw, FileText, CheckCircle, AlertCircle, Clock } from "lucide-react";';
const replImports = 'import { Book, RefreshCw, FileText, CheckCircle, AlertCircle, Clock, Download, X } from "lucide-react";\nimport { ExcelExportService } from "../services/ExcelExportService";\nimport { Revision, LegislativeNotice } from "../types";';
content = content.replace(targetImports, replImports);

const targetCompStart = 'export default function Dashboard() {\n  return (';
const replCompStart = `export default function Dashboard() {
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportYear, setExportYear] = useState<number>(new Date().getFullYear());
  const [exportMonth, setExportMonth] = useState<number | "ALL">("ALL");
  const [exportRevisions, setExportRevisions] = useState(true);
  const [exportNotices, setExportNotices] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!exportRevisions && !exportNotices) {
      alert("다운로드할 항목(개정 내역 또는 입법 예고)을 선택해주세요.");
      return;
    }

    try {
      setIsExporting(true);
      let revisionsData: Revision[] = [];
      let noticesData: LegislativeNotice[] = [];

      let queryParams = \`?year=\${exportYear}\`;
      if (exportMonth !== "ALL") {
        queryParams += \`&month=\${exportMonth}\`;
      }

      if (exportRevisions) {
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
      }

      if (revisionsData.length === 0 && noticesData.length === 0) {
        alert("선택한 조건에 해당하는 데이터가 없습니다.");
        return;
      }

      await ExcelExportService.exportRevisions(revisionsData, noticesData);
      setShowExportModal(false);
    } catch (e) {
      console.error(e);
      alert("엑셀 다운로드 중 오류가 발생했습니다.");
    } finally {
      setIsExporting(false);
    }
  };

  return (`;
content = content.replace(targetCompStart, replCompStart);

const targetHeader = `      <div>
        <h1 className="text-2xl font-bold text-slate-900">대시보드</h1>
        <p className="text-sm text-slate-500 mt-1">최근 법규 개정 현황 및 동기화 상태를 요약합니다.</p>
      </div>`;
const replHeader = `      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">대시보드</h1>
          <p className="text-sm text-slate-500 mt-1">최근 법규 개정 현황 및 동기화 상태를 요약합니다.</p>
        </div>
        <button 
          onClick={() => setShowExportModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2 font-medium text-sm shadow-sm"
        >
          <Download className="w-4 h-4" />
          엑셀 다운로드
        </button>
      </div>`;
content = content.replace(targetHeader, replHeader);

const targetReturnEnd = `    </div>
  );
}`;
const replReturnEnd = `    </div>

      {showExportModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <Download className="w-5 h-5 text-indigo-600" />
                엑셀 다운로드
              </h3>
              <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">기간 선택</label>
                <div className="flex gap-2">
                  <select 
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                    value={exportYear}
                    onChange={(e) => setExportYear(parseInt(e.target.value))}
                  >
                    {[2024, 2025, 2026, 2027].map(y => (
                      <option key={y} value={y}>{y}년</option>
                    ))}
                  </select>
                  <select 
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                    value={exportMonth}
                    onChange={(e) => setExportMonth(e.target.value === "ALL" ? "ALL" : parseInt(e.target.value))}
                  >
                    <option value="ALL">월 전체</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>{m}월</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="block text-sm font-medium text-slate-700">다운로드 항목</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      checked={exportRevisions}
                      onChange={(e) => setExportRevisions(e.target.checked)}
                    />
                    <span className="text-sm text-slate-700">개정 내역</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      checked={exportNotices}
                      onChange={(e) => setExportNotices(e.target.checked)}
                    />
                    <span className="text-sm text-slate-700">입법 예고</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button 
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
              >
                취소
              </button>
              <button 
                onClick={handleExport}
                disabled={isExporting}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isExporting ? "다운로드 중..." : "다운로드"}
              </button>
            </div>
          </div>
        </div>
      )}
  );
}`;
content = content.replace(targetReturnEnd, replReturnEnd);

fs.writeFileSync('src/pages/Dashboard.tsx', content);
