import fs from 'fs';
let content = fs.readFileSync('src/pages/RevisionHistory.tsx', 'utf-8');

// Add Trash2 icon
content = content.replace(
  'import { Download, Search, Filter, Eye, Sparkles, Loader2 } from "lucide-react";',
  'import { Download, Search, Filter, Eye, Sparkles, Loader2, Trash2 } from "lucide-react";'
);

// Add selectedItems state
content = content.replace(
  'const [selectedRevision, setSelectedRevision] = useState<Revision | null>(null);',
  'const [selectedRevision, setSelectedRevision] = useState<Revision | null>(null);\n  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());'
);

// Add toggle selection functions
const funcs = `
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
    if (!confirm(\`선택한 \${selectedItems.size}건의 개정 내역을 삭제하시겠습니까?\`)) return;
    
    try {
      await api.revisions.delete(Array.from(selectedItems));
      setRevisions(revisions.filter(r => !selectedItems.has(r.id)));
      setSelectedItems(new Set());
      if (selectedRevision && selectedItems.has(selectedRevision.id)) {
        setSelectedRevision(null);
      }
    } catch (e) {
      console.error(e);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };
`;

content = content.replace(
  'const [searchKeyword, setSearchKeyword] = useState("");',
  'const [searchKeyword, setSearchKeyword] = useState("");\n' + funcs
);

// Update header to add delete button
const oldHeader = `
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">개정 내역</h1>
            <p className="text-sm text-slate-500 mt-1">수집된 법규 개정 사항을 확인하고 비교합니다.</p>
          </div>
          <button onClick={handleExport} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-50 transition-colors flex items-center gap-2 font-medium text-sm shadow-sm">
            <Download className="w-4 h-4" />
            엑셀 다운로드
          </button>
        </div>
`;
const newHeader = `
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">개정 내역</h1>
            <p className="text-sm text-slate-500 mt-1">수집된 법규 개정 사항을 확인하고 비교합니다.</p>
          </div>
          <div className="flex gap-2">
            {selectedItems.size > 0 && (
              <button onClick={handleDeleteSelected} className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md hover:bg-red-100 transition-colors flex items-center gap-2 font-medium text-sm shadow-sm">
                <Trash2 className="w-4 h-4" />
                선택 삭제 ({selectedItems.size})
              </button>
            )}
            <button onClick={handleExport} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-50 transition-colors flex items-center gap-2 font-medium text-sm shadow-sm">
              <Download className="w-4 h-4" />
              엑셀 다운로드
            </button>
          </div>
        </div>
`;
content = content.replace(oldHeader.trim(), newHeader.trim());

// Update search area to add "select all" checkbox
const oldSearchArea = `
            <div className="flex gap-2">
              <select 
`;
const newSearchArea = `
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
`;
content = content.replace(oldSearchArea.trim(), newSearchArea.trim());

// Add checkbox to items
const oldItem = `
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-slate-900 text-sm">{rev.lawName}</h3>
`;
const newItem = `
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
`;
content = content.replace(new RegExp(oldItem.replace(/[.*+?^$\{value\}()|[\]\\]/g, '\\$&'), 'g'), newItem);

fs.writeFileSync('src/pages/RevisionHistory.tsx', content);
