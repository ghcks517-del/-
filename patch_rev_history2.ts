import fs from 'fs';
let content = fs.readFileSync('src/pages/RevisionHistory.tsx', 'utf-8');

const importTarget = `import { useState, useEffect, useMemo } from "react";
import { Search, Filter, Download, Trash2, CheckSquare, Square, CheckCircle2, Circle, Clock, AlertCircle, Edit2, Sparkles, Loader2 } from "lucide-react";`;
if (!content.includes('Loader2')) {
    content = content.replace(`import { Search, Filter, Download, Trash2, CheckSquare, Square, CheckCircle2, Circle, Clock, AlertCircle, Edit2, Sparkles } from "lucide-react";`, `import { Search, Filter, Download, Trash2, CheckSquare, Square, CheckCircle2, Circle, Clock, AlertCircle, Edit2, Sparkles, Loader2 } from "lucide-react";`);
}

const targetState = `  const [searchKeyword, setSearchKeyword] = useState("");`;
const replState = `  const [searchKeyword, setSearchKeyword] = useState("");
  const [isReanalyzing, setIsReanalyzing] = useState(false);`;
content = content.replace(targetState, replState);

const handleStatusChangeStr = `  const handleStatusChange = async (newStatus: Revision["reviewStatus"]) => {`;
const handleReanalyzeStr = `
  const handleReanalyze = async () => {
    if (!selectedRevision) return;
    setIsReanalyzing(true);
    try {
      const res = await fetch(\`/api/revisions/\${selectedRevision.id}/analyze\`, { method: "POST" });
      const data = await res.json();
      if (data.success && data.aiSummary) {
        const updated = { ...selectedRevision, aiSummary: data.aiSummary };
        setSelectedRevision(updated);
        setRevisions(revisions.map(r => r.id === updated.id ? updated : r));
      } else {
        alert("분석에 실패했습니다.");
      }
    } catch (e) {
      console.error(e);
      alert("분석 중 오류가 발생했습니다.");
    } finally {
      setIsReanalyzing(false);
    }
  };

  const handleStatusChange = async (newStatus: Revision["reviewStatus"]) => {`;
content = content.replace(handleStatusChangeStr, handleReanalyzeStr.trim());

const targetUI = `            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">AI 대응 방안 분석</label>
              <textarea 
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm h-32 bg-slate-50"
                value={selectedRevision.aiSummary?.responsePlan || "분석 결과가 없습니다."}
                readOnly
              />
            </div>`;
const replUI = `            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700">AI 대응 방안 분석</label>
                <button 
                  onClick={handleReanalyze}
                  disabled={isReanalyzing}
                  className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                >
                  {isReanalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  재분석
                </button>
              </div>
              <textarea 
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm h-32 bg-slate-50"
                value={selectedRevision.aiSummary?.responsePlan || "분석 결과가 없습니다. 우측 상단의 재분석 버튼을 클릭해주세요."}
                readOnly
              />
            </div>`;
content = content.replace(targetUI, replUI);

fs.writeFileSync('src/pages/RevisionHistory.tsx', content);
