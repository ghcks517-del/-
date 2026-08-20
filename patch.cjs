const fs = require('fs');
let code = fs.readFileSync('src/services/ExcelExportService.ts', 'utf-8');

const target = `
          const lineDiffs = diff.diffLines(bText, aText);
          const beforeRichText: any[] = [];
          const afterRichText: any[] = [];

          let pendingRemoved: diff.Change | null = null;
          let pendingAdded: diff.Change | null = null;
`;

const replacement = `
          const beforeRichText: any[] = [];
          const afterRichText: any[] = [];

          const hasHighlightMarkers = bText.includes('{|') || aText.includes('{|');
          if (hasHighlightMarkers) {
              const parseRichText = (text: string, isAdded: boolean) => {
                  if (!text || !text.trim()) {
                     return [{ text: isAdded ? '<삭 제>\\n' : '<신 설>\\n', font: { color: { argb: isAdded ? "FF5a6e85" : "FFe11d48" } } }];
                  }
                  if (text === "[신설]" || text === "<신 설>") return [{ text: '<신 설>\\n', font: { color: { argb: "FFe11d48" } } }];
                  if (text === "[생략]" || text === "[삭제]" || text === "<생 략>") return [{ text: text.replace('[', '<').replace(']', '>') + '\\n', font: { color: { argb: "FF5a6e85" } } }];

                  const parts = text.split(/\\{\\||\\|\\}/);
                  const richText: any[] = [];
                  parts.forEach((part, index) => {
                      if (!part) return;
                      if (index % 2 === 1) {
                          richText.push({ text: part, font: { color: { argb: isAdded ? "FF2563eb" : "FFe11d48" } } });
                      } else {
                          richText.push({ text: part });
                      }
                  });
                  richText.push({ text: '\\n' });
                  return richText;
              };
              beforeRichText.push(...parseRichText(bText, false));
              afterRichText.push(...parseRichText(aText, true));
          } else {
          const lineDiffs = diff.diffLines(bText, aText);
          let pendingRemoved: diff.Change | null = null;
          let pendingAdded: diff.Change | null = null;
`;

code = code.replace(target.trim(), replacement.trim());

const target2 = `
              const lines = part.value.split('\\n');
              beforeRichText.push({ text: part.value });
              afterRichText.push({ text: part.value });
            }
          });
          flush();

          if (beforeRichText.length > 0 && beforeRichText[beforeRichText.length - 1].text.endsWith('\\n')) {
`;

const replacement2 = `
              const lines = part.value.split('\\n');
              beforeRichText.push({ text: part.value });
              afterRichText.push({ text: part.value });
            }
          });
          flush();
          }

          if (beforeRichText.length > 0 && beforeRichText[beforeRichText.length - 1].text.endsWith('\\n')) {
`;

code = code.replace(target2.trim(), replacement2.trim());

fs.writeFileSync('src/services/ExcelExportService.ts', code);
