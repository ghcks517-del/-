import fs from 'fs';
let content = fs.readFileSync('src/pages/RevisionHistory.tsx', 'utf-8');

// replace the confirm with a custom state
content = content.replace(
  'const [searchKeyword, setSearchKeyword] = useState("");',
  'const [searchKeyword, setSearchKeyword] = useState("");\n  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);'
);

// in handleDeleteSelected
content = content.replace(
  'if (!confirm(`선택한 ${selectedItems.size}건의 개정 내역을 삭제하시겠습니까?`)) return;',
  ''
);

const oldHeader = `
            {selectedItems.size > 0 && (
              <button onClick={handleDeleteSelected} className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md hover:bg-red-100 transition-colors flex items-center gap-2 font-medium text-sm shadow-sm">
                <Trash2 className="w-4 h-4" />
                선택 삭제 ({selectedItems.size})
              </button>
            )}
`.trim();

const newHeader = `
            {selectedItems.size > 0 && (
              <button onClick={() => setShowDeleteConfirm(true)} className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md hover:bg-red-100 transition-colors flex items-center gap-2 font-medium text-sm shadow-sm">
                <Trash2 className="w-4 h-4" />
                선택 삭제 ({selectedItems.size})
              </button>
            )}
`.trim();

content = content.replace(oldHeader, newHeader);

// add modal at the end of the return statement
const modal = `
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
`;

content = content.replace(/<\/div>\s*<\/div>\s*\)\s*;\s*}\s*$/m, "</div>\n" + modal + "\n}");

fs.writeFileSync('src/pages/RevisionHistory.tsx', content);
