import fs from 'fs';
let content = fs.readFileSync('src/pages/LegislativeNoticeList.tsx', 'utf-8');
content = content.replace(
    'const [selectedMonth, setSelectedMonth] = useState<number | "ALL">("ALL");',
    'const [selectedMonth, setSelectedMonth] = useState<number | "ALL">("ALL");\n  const [selectedIds, setSelectedIds] = useState<string[]>([]);'
);
fs.writeFileSync('src/pages/LegislativeNoticeList.tsx', content);
