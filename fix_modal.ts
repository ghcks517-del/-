import fs from 'fs';
let content = fs.readFileSync('src/pages/RevisionHistory.tsx', 'utf-8');

const modalStr = `
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
`;

// Remove the modal from wherever it was inserted
content = content.replace(modalStr, "");

// Insert it right before the end of RevisionHistory
const target = `
      )}
    </div>
  );
}
`;

const replacement = `
      )}
${modalStr}
    </div>
  );
}
`;

content = content.replace(target, replacement);

fs.writeFileSync('src/pages/RevisionHistory.tsx', content);
