import fs from 'fs';
let content = fs.readFileSync('server/services/LawApiClient.ts', 'utf-8');

const targetOldNew = `            for (const j of oldJomuns) {
              beforeText += cleanHtml(j._) + "\\n\\n";
            }
            for (const j of newJomuns) {
              afterText += cleanHtml(j._) + "\\n\\n";
            }`;

const replOldNew = `            const cleanHtmlBasic = (str: string) => {
              if (!str) return "";
              return str.replace(/<[^>]+>/g, '').trim();
            };

            const length = Math.max(oldJomuns.length, newJomuns.length);
            for (let i = 0; i < length; i++) {
              let oldStr = oldJomuns[i]?._ || "";
              let newStr = newJomuns[i]?._ || "";
              
              if (/<신\\s*설>/i.test(oldStr)) {
                 let cleanNew = cleanHtmlBasic(newStr);
                 let label = "신설";
                 if (/^제\\d+조/.test(cleanNew)) label = "조항 신설";
                 else if (/^[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮]/.test(cleanNew)) label = "항 신설";
                 else if (/^\\d+\\./.test(cleanNew)) label = "호 신설";
                 else if (/^[가-하]\\./.test(cleanNew)) label = "목 신설";
                 
                 oldStr = oldStr.replace(/<신\\s*설>/gi, \`[\${label}]\`);
              }

              if (/<삭\\s*제>/i.test(newStr)) {
                 let cleanOld = cleanHtmlBasic(oldStr);
                 let label = "삭제";
                 if (/^제\\d+조/.test(cleanOld)) label = "조항 삭제";
                 else if (/^[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮]/.test(cleanOld)) label = "항 삭제";
                 else if (/^\\d+\\./.test(cleanOld)) label = "호 삭제";
                 else if (/^[가-하]\\./.test(cleanOld)) label = "목 삭제";
                 
                 newStr = newStr.replace(/<삭\\s*제>/gi, \`[\${label}]\`);
              }

              beforeText += cleanHtml(oldStr) + "\\n\\n";
              afterText += cleanHtml(newStr) + "\\n\\n";
            }`;

content = content.replace(targetOldNew, replOldNew);
content = content.replace(`.replace(/<생\\s*략>/gi, '[생략]')`, `.replace(/<생\\s*략>/gi, '[생략]')\n                        .replace(/<삭\\s*제>/gi, '[삭제]')`);

fs.writeFileSync('server/services/LawApiClient.ts', content);
