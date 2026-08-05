import fs from 'fs';
let content = fs.readFileSync('server/gemini.ts', 'utf-8');
content = content.replace('model: "gemini-2.5-pro"', 'model: "gemini-2.5-flash"');
fs.writeFileSync('server/gemini.ts', content);
