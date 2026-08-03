import fs from 'fs';
let content = fs.readFileSync('src/pages/RevisionHistory.tsx', 'utf-8');

const oldItem = `
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-slate-900 text-sm">{rev.lawName}</h3>
`.trim();

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
`.trim();

content = content.replace(oldItem, newItem);
fs.writeFileSync('src/pages/RevisionHistory.tsx', content);
