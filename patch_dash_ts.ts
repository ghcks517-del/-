import fs from 'fs';
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

content = content.replace(
    'if (exportYear !== "ALL" && y !== String(exportYear)) return false;',
    'if (y !== String(exportYear)) return false;'
).replace(
    'if (exportYear !== "ALL" && y !== String(exportYear)) return false;',
    'if (y !== String(exportYear)) return false;'
);

content = content.replace(
    'const [exportYear, setExportYear] = useState<number>(new Date().getFullYear());',
    'const [exportYear, setExportYear] = useState<number | "ALL">(new Date().getFullYear());'
);

content = content.replace(
    '<select \n                    className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm"\n                    value={exportYear}\n                    onChange={(e) => setExportYear(parseInt(e.target.value))}\n                  >',
    '<select \n                    className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm"\n                    value={exportYear}\n                    onChange={(e) => setExportYear(e.target.value === "ALL" ? "ALL" : parseInt(e.target.value))}\n                  >\n                    <option value="ALL">연도 전체</option>'
);

content = content.replace(
    'if (y !== String(exportYear)) return false;',
    'if (exportYear !== "ALL" && y !== String(exportYear)) return false;'
).replace(
    'if (y !== String(exportYear)) return false;',
    'if (exportYear !== "ALL" && y !== String(exportYear)) return false;'
);

fs.writeFileSync('src/pages/Dashboard.tsx', content);
