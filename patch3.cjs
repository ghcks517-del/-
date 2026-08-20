const fs = require('fs');
let code = fs.readFileSync('src/services/ExcelExportService.ts', 'utf-8');

const target = `
                  if (text === "[신설]" || text === "<신 설>") return [{ text: '<신 설>\\n', font: { color: { argb: "FFe11d48" } } }];
                  if (text === "[생략]" || text === "[삭제]" || text === "<생 략>") return [{ text: text.replace('[', '<').replace(']', '>') + '\\n', font: { color: { argb: "FF5a6e85" } } }];
`;

const replacement = `
                  const pureText = text.replace(/\\{\\||\\|\\}/g, '').trim();
                  if (pureText === "[신설]" || pureText === "<신 설>") return [{ text: '<신 설>\\n', font: { color: { argb: "FFe11d48" } } }];
                  if (pureText === "[생략]" || pureText === "[삭제]" || pureText === "<생 략>") return [{ text: pureText.replace('[', '<').replace(']', '>') + '\\n', font: { color: { argb: "FF5a6e85" } } }];
`;

code = code.replace(target.trim(), replacement.trim());
fs.writeFileSync('src/services/ExcelExportService.ts', code);
