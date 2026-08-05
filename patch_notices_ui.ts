import fs from 'fs';
let content = fs.readFileSync('src/pages/LegislativeNoticeList.tsx', 'utf-8');

const importRegex = /import { LegislativeNotice } from "\.\.\/types";/;
content = content.replace(importRegex, 'import { LegislativeNotice } from "../types";\nimport { CheckSquare } from "lucide-react";');

const stateRegex = /const \[selectedMonth, setSelectedMonth\] = useState<number \| "ALL">("ALL");/;
content = content.replace(stateRegex, `const [selectedMonth, setSelectedMonth] = useState<number | "ALL">("ALL");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);`);

const deleteLogic = `
  const handleDelete = async (id: string) => {
    if (!confirm("이 입법예고를 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(\`/api/legislative-notices/\${id}\`, { method: "DELETE" });
      if (res.ok) {
        setNotices(notices.filter(n => n.id !== id));
        setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
      } else {
        alert("삭제에 실패했습니다.");
      }
    } catch (e) {
      console.error(e);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(\`선택한 \${selectedIds.length}건의 입법예고를 삭제하시겠습니까?\`)) return;
    
    try {
      const res = await fetch(\`/api/legislative-notices/bulk-delete\`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds })
      });
      if (res.ok) {
        setNotices(notices.filter(n => !selectedIds.includes(n.id)));
        setSelectedIds([]);
      } else {
        alert("삭제에 실패했습니다.");
      }
    } catch (e) {
      console.error(e);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredNotices.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredNotices.map(n => n.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]
    );
  };
`;

const handleRegex = /const handleDelete = async \(id: string\) => {[\s\S]*?};\n/m;
content = content.replace(handleRegex, deleteLogic);

const headerRegex = /<div className="flex justify-between items-center">\s*<div>\s*<h1 className="text-2xl font-bold text-slate-900">입법예고<\/h1>\s*<p className="text-sm text-slate-500 mt-1">수집된 입법예고 및 행정예고 사항을 확인합니다\.<\/p>\s*<\/div>\s*<\/div>/m;
const newHeader = `<div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">입법예고</h1>
          <p className="text-sm text-slate-500 mt-1">수집된 입법예고 및 행정예고 사항을 확인합니다.</p>
        </div>
        {selectedIds.length > 0 && (
          <button 
            onClick={handleBulkDelete}
            className="flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-md font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            선택 삭제 ({selectedIds.length})
          </button>
        )}
      </div>`;
content = content.replace(headerRegex, newHeader);

const listHeaderRegex = /<div className="flex-1 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">\s*\{loading \? \(/m;
const newListHeader = `<div className="flex-1 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
        {!loading && filteredNotices.length > 0 && (
          <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                checked={selectedIds.length === filteredNotices.length && filteredNotices.length > 0}
                onChange={toggleSelectAll}
              />
              전체 선택
            </label>
            <div className="text-sm text-slate-500">총 {filteredNotices.length}건</div>
          </div>
        )}
        {loading ? (`;
content = content.replace(listHeaderRegex, newListHeader);

const itemRegex = /<div key=\{notice\.id\} className="p-6 border-b border-slate-100 hover:bg-slate-50 transition-colors">\s*<div className="flex justify-between items-start mb-2">\s*<h3 className="text-lg font-bold text-slate-900 pr-4">\{notice\.title\}<\/h3>/m;
const newItemRegex = `<div key={notice.id} className="p-6 border-b border-slate-100 hover:bg-slate-50 transition-colors flex gap-4">
                <div className="pt-1">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    checked={selectedIds.includes(notice.id)}
                    onChange={() => toggleSelect(notice.id)}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-slate-900 pr-4">{notice.title}</h3>`;
content = content.replace(itemRegex, newItemRegex);

// closing div for the new wrapper
const itemEndRegex = /<\/div>\s*<\/div>\s*\}\)\}\s*<\/div>\s*\}\)\s*<\/div>\s*<\/div>\s*\);\s*\}/m;
// Wait, I need to add `</div>` before `</div>` at the end of notice map
const noticeMapRegex = /<ExternalLink className="w-4 h-4" \/>\s*상세보기\s*<\/a>\s*<\/div>\s*<\/div>\s*\)\)\}/m;
const newNoticeMap = `<ExternalLink className="w-4 h-4" />
                    상세보기
                  </a>
                </div>
                </div>
              </div>
            ))}`;
content = content.replace(noticeMapRegex, newNoticeMap);

fs.writeFileSync('src/pages/LegislativeNoticeList.tsx', content);
