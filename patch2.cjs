const fs = require('fs');
let code = fs.readFileSync('src/pages/RevisionHistory.tsx', 'utf-8');

const target = `
    if (text === "&lt;신 설&gt;" || text === "[신설]") return <span className="text-[#e11d48]">&lt;신 설&gt;</span>;
    if (text === "&lt;생 략&gt;" || text === "[생략]" || text === "[삭제]") return <span className="text-slate-500">{text.replace('[', '&lt;').replace(']', '&gt;')}</span>;
`;

const replacement = `
    const pureText = text.replace(/\\{\\||\\|\\}/g, '').trim();
    if (pureText === "&lt;신 설&gt;" || pureText === "[신설]") return <span className="text-[#e11d48]">&lt;신 설&gt;</span>;
    if (pureText === "&lt;생 략&gt;" || pureText === "[생략]" || pureText === "[삭제]") return <span className="text-slate-500">{pureText.replace('[', '&lt;').replace(']', '&gt;')}</span>;
`;

code = code.replace(target.trim(), replacement.trim());
fs.writeFileSync('src/pages/RevisionHistory.tsx', code);
