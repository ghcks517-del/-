import { useState, useEffect } from "react";
import { Download, Search, Filter, Eye, Sparkles, Loader2, Trash2 } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Revision, REVIEW_STATUS_LABELS } from "../types";
import clsx from "clsx";
import * as diff from "diff";
import { ExcelExportService } from "../services/ExcelExportService";
import { api } from "../api";

export default function RevisionHistory() {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRevision, setSelectedRevision] = useState<Revision | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number | "ALL">("ALL");
  const [selectedMonth, setSelectedMonth] = useState<number | "ALL">("ALL");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleToggleSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedItems);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedItems(next);
  };

  const handleToggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedItems(new Set(filteredRevisions.map(r => r.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.size === 0) return;
    
    
    try {
      await api.revisions.delete(Array.from(selectedItems));
      setRevisions(prev => prev.filter(r => !selectedItems.has(r.id)));
      setSelectedItems(new Set());
      if (selectedRevision && selectedItems.has(selectedRevision.id)) {
        setSelectedRevision(null);
      }
    } catch (e) {
      console.error(e);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };


  

  useEffect(() => {
    setLoading(true);
    const loadRevisions = async () => {
      try {
        const data = await fetch("/api/revisions").then(r => r.json());
        if (Array.isArray(data)) {
            setRevisions(data);
        }
      } catch(e) {
          console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadRevisions();
  }, []);

const handleReanalyze = async () => {
    if (!selectedRevision) return;
    setIsReanalyzing(true);
    try {
      const res = await fetch(`/api/revisions/${selectedRevision.id}/analyze`, { method: "POST" });
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

  const handleStatusChange = async (newStatus: Revision["reviewStatus"]) => {
    if (!selectedRevision) return;
    try {
      await fetch(`/api/revisions/${selectedRevision.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reviewStatus: newStatus })
      });
      const updated = { ...selectedRevision, reviewStatus: newStatus };
      setSelectedRevision(updated);
      setRevisions(revisions.map(r => r.id === selectedRevision.id ? updated : r));
    } catch(e) {
        console.error(e);
        alert("상태 변경에 실패했습니다.");
    }
  };

  const handleExport = async () => {
    await ExcelExportService.exportRevisions(filteredRevisions);
  };

  const filteredRevisions = revisions.filter(rev => {
    if (searchKeyword && !rev.lawName.toLowerCase().includes(searchKeyword.toLowerCase())) {
       return false;
    }
    if (selectedYear !== "ALL" || selectedMonth !== "ALL") {
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
    }
    return true;
  }).sort((a, b) => {
    const dateA = a.promulgationDate || "";
    const dateB = b.promulgationDate || "";
    return dateA.localeCompare(dateB);
  });

  return (
    <div className="p-8 max-w-7xl mx-auto flex h-full gap-6">
      <div className={clsx("flex flex-col flex-1", selectedRevision && "w-1/3 flex-none")}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">개정 내역</h1>
            <p className="text-sm text-slate-500 mt-1">수집된 법규 개정 사항을 확인하고 비교합니다.</p>
          </div>
          <div className="flex gap-2">
            {selectedItems.size > 0 && (
              <button onClick={() => setShowDeleteConfirm(true)} className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md hover:bg-red-100 transition-colors flex items-center gap-2 font-medium text-sm shadow-sm">
                <Trash2 className="w-4 h-4" />
                선택 삭제 ({selectedItems.size})
              </button>
            )}

          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex-1 flex flex-col min-h-0">
          <div className="p-4 border-b border-slate-200 flex flex-col gap-3">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="검색..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-md border border-slate-200 mb-2">
              <input 
                type="checkbox" 
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 ml-1"
                checked={filteredRevisions.length > 0 && selectedItems.size === filteredRevisions.length}
                onChange={handleToggleAll}
              />
              <span className="text-sm font-medium text-slate-700">전체 선택</span>
            </div>
            <div className="flex gap-2">
              <select 
                className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value === "ALL" ? "ALL" : parseInt(e.target.value))}
              >
                <option value="ALL">연도 전체</option>
                {Array.from({ length: 5 }, (_, i) => currentYear - i).map(year => (
                  <option key={year} value={year}>{year}년</option>
                ))}
              </select>
              <select 
                className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value === "ALL" ? "ALL" : parseInt(e.target.value))}
              >
                <option value="ALL">월 전체</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>{month}월</option>
                ))}
              </select>
            </div>
          </div>
          <div className="overflow-y-auto flex-1 p-2">
            {filteredRevisions.map((rev) => (
              <div 
                key={rev.id} 
                onClick={() => { setSelectedRevision(rev); }}
                className={clsx(
                  "p-4 rounded-md cursor-pointer border mb-2 transition-colors",
                  selectedRevision?.id === rev.id ? "bg-blue-50 border-blue-200" : "bg-white border-slate-200 hover:bg-slate-50"
                )}
              >
                <div className="flex justify-between items-start mb-2 gap-2">
                  <div className="flex items-start gap-2 pt-0.5">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-1 cursor-pointer"
                      checked={selectedItems.has(rev.id)}
                      onChange={(e) => handleToggleSelection(rev.id, e as any)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <h3 className="font-medium text-slate-900 text-sm leading-snug">{rev.lawName}</h3>
                  </div>
                  <span className={clsx(
                    "text-xs px-2 py-0.5 rounded-full font-medium",
                    rev.reviewStatus === "NEW" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"
                  )}>
                    {REVIEW_STATUS_LABELS[rev.reviewStatus]}
                  </span>
                </div>
                <div className="text-xs text-slate-500 flex gap-3">
                  <span>공포: {rev.promulgationDate}</span>
                  <span>시행: {rev.enforcementDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedRevision && (
        <div className="flex-1 bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col min-h-0 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <div>
              <h2 className="font-bold text-lg text-slate-900">{selectedRevision.lawName}</h2>
              <p className="text-xs text-slate-500 mt-1">공포일: {selectedRevision.promulgationDate} | 시행일: {selectedRevision.enforcementDate}</p>
            </div>
            <button onClick={() => { setSelectedRevision(null); }} className="text-slate-400 hover:text-slate-600">
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">개정 전/후 비교</h3>
              </div>
              <DiffViewer before={selectedRevision.beforeText} after={selectedRevision.afterText} diffData={selectedRevision.diffData} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">관련 부서</label>
                <input 
                  type="text" 
                  value={selectedRevision.departments.join(", ")}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">검토 상태</label>
                <select 
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  value={selectedRevision.reviewStatus}
                  onChange={(e) => handleStatusChange(e.target.value as Revision["reviewStatus"])}
                >
                  {Object.entries(REVIEW_STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
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
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-lg w-96 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-2">항목 삭제</h2>
            <p className="text-sm text-slate-600 mb-6">선택한 {selectedItems.size}건의 개정 내역을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50"
              >
                취소
              </button>
              <button 
                onClick={() => {
                  setShowDeleteConfirm(false);
                  handleDeleteSelected();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function DiffViewer({ before, after, diffData }: { before: string; after: string; diffData?: string }) {
  let parsedPairs = null;
  if (diffData) {
    try {
      parsedPairs = JSON.parse(diffData);
    } catch (e) {}
  }

  if (parsedPairs && Array.isArray(parsedPairs) && parsedPairs.length > 0) {
    return (
      <div className="border border-slate-300 rounded-lg overflow-hidden flex flex-col shadow-sm bg-white">
        <div className="grid grid-cols-2 bg-[#f8f9fa] border-b border-slate-300">
          <div className="p-3 text-center text-sm font-bold text-slate-700 border-r border-slate-300">현행</div>
          <div className="p-3 text-center text-sm font-bold text-slate-700">개정안</div>
        </div>
        <div className="flex flex-col">
          {parsedPairs.map((pair, idx) => {
             // to show diffs inside the pair, we could do diffWordsWithSpace, but usually oldAndNew format doesn't have exact same structure.
             // Let's use diffWordsWithSpace just in case they are similar, or just render it.
             const oldText = pair.old || "";
             const newText = pair.new || "";
             
             // If old and new are exactly the same or just spacing diff, we can just show it. 
             // But actually showing word diffs is better.
             const wordDiffs = diff.diffWordsWithSpace(oldText, newText);
             
             return (
               <div className="grid grid-cols-2 border-b border-slate-300 last:border-0" key={idx}>
                 <div className="p-4 text-sm leading-[1.7] whitespace-pre-wrap text-slate-800 border-r border-slate-300 break-keep">
                   {oldText === "&lt;신 설&gt;" ? <span className="text-[#e11d48]">&lt;신 설&gt;</span> : 
                     (oldText ? wordDiffs.map((part, i) => {
                       if (part.added) return null;
                       return <span key={i} className={part.removed ? "text-[#e11d48] line-through bg-red-50" : ""}>{part.value}</span>;
                     }) : <span className="text-[#e11d48]">&lt;신 설&gt;</span>)}
                 </div>
                 <div className="p-4 text-sm leading-[1.7] whitespace-pre-wrap text-slate-800 break-keep">
                   {newText === "&lt;생 략&gt;" ? <span className="text-slate-500">&lt;생 략&gt;</span> :
                     (newText ? wordDiffs.map((part, i) => {
                       if (part.removed) return null;
                       return <span key={i} className={part.added ? "text-[#2563eb] font-medium bg-blue-50" : ""}>{part.value}</span>;
                     }) : <span className="text-slate-500">&lt;삭 제&gt;</span>)}
                 </div>
               </div>
             );
          })}
        </div>
    </div>
  );

}
  // fallback to generic diffLines
  const lineDiffs = diff.diffLines(before, after);
  
  
  
  const rows: any[] = [];
  let pendingRemoved: diff.Change | null = null;
  let pendingAdded: diff.Change | null = null;

  const flush = () => {
    if (pendingRemoved || pendingAdded) {
      const bText = pendingRemoved ? pendingRemoved.value.replace(/\n$/, '') : "";
      const aText = pendingAdded ? pendingAdded.value.replace(/\n$/, '') : "";
      
      const wordDiffs = diff.diffWordsWithSpace(bText, aText);
      
      rows.push(
        <div className="grid grid-cols-2 border-b border-slate-300 last:border-0" key={rows.length}>
          <div className="p-4 text-sm leading-[1.7] whitespace-pre-wrap text-slate-800 border-r border-slate-300 break-keep">
            {bText ? wordDiffs.map((part, index) => {
              if (part.added) return null;
              return <span key={index} className={part.removed ? "text-[#e11d48]" : ""}>{part.value}</span>;
            }) : <span className="text-[#e11d48]">&lt;신 설&gt;</span>}
          </div>
          <div className="p-4 text-sm leading-[1.7] whitespace-pre-wrap text-slate-800 break-keep">
            {aText ? wordDiffs.map((part, index) => {
              if (part.removed) return null;
              return <span key={index} className={part.added ? "text-[#2563eb]" : ""}>{part.value}</span>;
            }) : <span className="text-slate-500">&lt;삭 제&gt;</span>}
          </div>
        </div>
      );
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
      if (lines[lines.length - 1] === '') {
        lines.pop();
      }
      lines.forEach((line) => {
        rows.push(
          <div className="grid grid-cols-2 border-b border-slate-300 last:border-0" key={rows.length}>
            <div className="p-4 text-sm leading-[1.7] whitespace-pre-wrap text-slate-800 border-r border-slate-300 break-keep">{line}</div>
            <div className="p-4 text-sm leading-[1.7] whitespace-pre-wrap text-slate-800 break-keep">{line}</div>
          </div>
        );
      });
    }
    
    if (pendingRemoved && pendingAdded) {
       flush();
    }
  });
  flush();

  return (
    <div className="border border-slate-300 rounded-lg overflow-hidden flex flex-col shadow-sm bg-white">
      <div className="grid grid-cols-2 bg-[#f8f9fa] border-b border-slate-300">
        <div className="p-3 text-center text-sm font-bold text-slate-700 border-r border-slate-300">
          개정 전
        </div>
        <div className="p-3 text-center text-sm font-bold text-slate-700">
          개정 후
        </div>
      </div>
      <div className="flex flex-col">
        {rows.length > 0 ? rows : (
           <div className="p-8 text-center text-slate-500 text-sm">내용이 동일하거나 없습니다.</div>
        )}
      </div>
    </div>
  );
}
