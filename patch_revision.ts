import fs from 'fs';
let content = fs.readFileSync('src/pages/RevisionHistory.tsx', 'utf-8');
content = content.replace(
  'import { Download, Search, Filter, Eye } from "lucide-react";',
  'import { Download, Search, Filter, Eye, Sparkles, Loader2 } from "lucide-react";\nimport Markdown from "react-markdown";\nimport remarkGfm from "remark-gfm";'
);
content = content.replace(
  'const [selectedRevision, setSelectedRevision] = useState<Revision | null>(null);',
  'const [selectedRevision, setSelectedRevision] = useState<Revision | null>(null);\n  const [aiComparison, setAiComparison] = useState<string | null>(null);\n  const [isGeneratingAI, setIsGeneratingAI] = useState(false);'
);
fs.writeFileSync('src/pages/RevisionHistory.tsx', content);
