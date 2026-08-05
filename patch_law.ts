import fs from 'fs';
let content = fs.readFileSync('server/services/LawApiClient.ts', 'utf-8');

const target = `
        const matchedLaw = parsed.LawSearch.law.find((l: any) => {
           const pDate = l['공포일자']?.[0] || "";
           return pDate.startsWith(\`\${targetYearStr}\${targetMonthStr}\`);
        });
`.trim();

const repl = `
        const matchedLaw = parsed.LawSearch.law.find((l: any) => {
           const pDate = l['공포일자']?.[0] || "";
           const actualName = l['법령명한글']?.[0] || "";
           return pDate.startsWith(\`\${targetYearStr}\${targetMonthStr}\`) && actualName.replace(/ /g, '') === lawName.replace(/ /g, '');
        });
`.trim();

content = content.replace(target, repl);
fs.writeFileSync('server/services/LawApiClient.ts', content);
