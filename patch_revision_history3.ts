import fs from 'fs';
let content = fs.readFileSync('src/pages/RevisionHistory.tsx', 'utf-8');

const diffViewerCode = `
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
`;

content = content.replace(
  'function DiffViewer({ before, after }: { before: string; after: string }) {',
  diffViewerCode.trim()
);

// We need to also make sure we pass diffData to the component
content = content.replace(
  '<DiffViewer before={selectedRevision.beforeText} after={selectedRevision.afterText} />',
  '<DiffViewer before={selectedRevision.beforeText} after={selectedRevision.afterText} diffData={selectedRevision.diffData} />'
);

// also in the fallback, we had `const lineDiffs = diff.diffLines(before, after);`
// wait, the original was:
/*
function DiffViewer({ before, after }: { before: string; after: string }) {
  const lineDiffs = diff.diffLines(before, after);
*/
// The replace above will overwrite `const lineDiffs = ...`.
// Let's verify that the fallback still works. The new code defines `lineDiffs` again. Yes!

fs.writeFileSync('src/pages/RevisionHistory.tsx', content);
