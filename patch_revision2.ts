import fs from 'fs';
let content = fs.readFileSync('src/pages/RevisionHistory.tsx', 'utf-8');

const func = `
  const handleGenerateAiComparison = async () => {
    if (!selectedRevision) return;
    setIsGeneratingAI(true);
    setAiComparison(null);
    try {
      const response = await fetch("/api/revisions/compare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          lawName: selectedRevision.lawName,
          enforcementDate: selectedRevision.enforcementDate,
          currentText: selectedRevision.afterText
        })
      });
      const data = await response.json();
      if (data.comparisonTable) {
        setAiComparison(data.comparisonTable);
      } else if (data.error) {
        alert(data.error);
      }
    } catch (e) {
      alert("AI 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGeneratingAI(false);
    }
  };
`;

content = content.replace(
  'const [searchKeyword, setSearchKeyword] = useState("");',
  'const [searchKeyword, setSearchKeyword] = useState("");\n' + func
);

const diffViewerUI = `
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">개정 전/후 비교</h3>
                <button 
                  onClick={handleGenerateAiComparison}
                  disabled={isGeneratingAI}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md text-xs font-medium border border-indigo-200 transition-colors disabled:opacity-50"
                >
                  {isGeneratingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {isGeneratingAI ? "AI 비교표 생성 중..." : "AI 비교표 자동 생성"}
                </button>
              </div>
              {aiComparison ? (
                <div className="prose prose-sm max-w-none border border-indigo-200 rounded-lg p-6 bg-indigo-50/30 prose-table:w-full prose-table:border-collapse prose-th:border prose-th:border-slate-300 prose-th:bg-slate-100 prose-th:p-2 prose-td:border prose-td:border-slate-300 prose-td:p-2">
                  <Markdown remarkPlugins={[remarkGfm]}>{aiComparison}</Markdown>
                </div>
              ) : (
                <DiffViewer before={selectedRevision.beforeText} after={selectedRevision.afterText} />
              )}
            </div>
`;

content = content.replace(
  /<div>\s*<h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">개정 전\/후 비교<\/h3>\s*<DiffViewer before=\{selectedRevision\.beforeText\} after=\{selectedRevision\.afterText\} \/>\s*<\/div>/,
  diffViewerUI
);

// clear ai state when selected revision changes
content = content.replace(
  'onClick={() => setSelectedRevision(rev)}',
  'onClick={() => { setSelectedRevision(rev); setAiComparison(null); }}'
);

content = content.replace(
  'onClick={() => setSelectedRevision(null)}',
  'onClick={() => { setSelectedRevision(null); setAiComparison(null); }}'
);

fs.writeFileSync('src/pages/RevisionHistory.tsx', content);
