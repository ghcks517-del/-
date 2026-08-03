import fs from 'fs';
let content = fs.readFileSync('server/services/LawApiClient.ts', 'utf-8');

const oldCode = `
          if (oldAndNewParsed.OldAndNewService && oldAndNewParsed.OldAndNewService.구조문목록 && oldAndNewParsed.OldAndNewService.신조문목록) {
            const oldJomuns = oldAndNewParsed.OldAndNewService.구조문목록[0].조문 || [];
            const newJomuns = oldAndNewParsed.OldAndNewService.신조문목록[0].조문 || [];

            const cleanHtml = (str: string) => {
              if (!str) return "";
              return str.replace(/<신\s*설>/gi, '[신설]')
                        .replace(/<생\s*략>/gi, '[생략]')
                        .replace(/<P>/gi, '')
                        .replace(/<\/P>/gi, '\n')
                        .replace(/&nbsp;/g, ' ')
                        .replace(/<br\s*\/?>/gi, '\n')
                        .replace(/<[^>]+>/g, '')
                        .trim();
            };

            for (const j of oldJomuns) {
              beforeText += cleanHtml(j._) + "\n\n";
            }
            for (const j of newJomuns) {
              afterText += cleanHtml(j._) + "\n\n";
            }
            beforeText = beforeText.trim();
            afterText = afterText.trim();
          } else {
`;

const newCode = `
          let diffDataStr = "";
          if (oldAndNewParsed.OldAndNewService && oldAndNewParsed.OldAndNewService.구조문목록 && oldAndNewParsed.OldAndNewService.신조문목록) {
            const oldJomuns = oldAndNewParsed.OldAndNewService.구조문목록[0].조문 || [];
            const newJomuns = oldAndNewParsed.OldAndNewService.신조문목록[0].조문 || [];

            const cleanHtml = (str: string) => {
              if (!str) return "";
              return str.replace(/<신\s*설>/gi, '&lt;신 설&gt;')
                        .replace(/<생\s*략>/gi, '&lt;생 략&gt;')
                        .replace(/<P>/gi, '')
                        .replace(/<\/P>/gi, '\n')
                        .replace(/&nbsp;/g, ' ')
                        .replace(/<br\s*\/?>/gi, '\n')
                        .replace(/<[^>]+>/g, '')
                        .trim();
            };

            const pairs = [];
            const maxLen = Math.max(oldJomuns.length, newJomuns.length);
            for (let i = 0; i < maxLen; i++) {
              const oldText = oldJomuns[i] ? cleanHtml(oldJomuns[i]._) : "";
              const newText = newJomuns[i] ? cleanHtml(newJomuns[i]._) : "";
              pairs.push({ old: oldText, new: newText });
              beforeText += oldText + "\\n\\n";
              afterText += newText + "\\n\\n";
            }
            beforeText = beforeText.trim();
            afterText = afterText.trim();
            diffDataStr = JSON.stringify(pairs);
          } else {
`;

content = content.replace(oldCode.trim(), newCode.trim());

// Also need to pass diffDataStr to the return object
content = content.replace(
  'diffData: "",',
  'diffData: typeof diffDataStr !== "undefined" ? diffDataStr : "",'
);

// We need to inject `let diffData = ""` at the top, but since we are doing `typeof diffDataStr` it might be tricky.
// Wait, `diffDataStr` is scoped inside the `try` block. Let's just define `let diffData = "";` before `try`.
content = content.replace(
  'let sourceLawId = `mock-lawid-${lawName}`;',
  'let sourceLawId = `mock-lawid-${lawName}`;\n    let diffData = "";'
);

content = content.replace(
  'diffDataStr = JSON.stringify(pairs);',
  'diffData = JSON.stringify(pairs);'
);

content = content.replace(
  'diffData: typeof diffDataStr !== "undefined" ? diffDataStr : "",',
  'diffData,'
);

// wait, let me just replace the 'diffData: "",' with 'diffData,' 
content = content.replace('diffData: "",', 'diffData,');

fs.writeFileSync('server/services/LawApiClient.ts', content);
