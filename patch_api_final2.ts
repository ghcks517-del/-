import fs from 'fs';

let content = fs.readFileSync('server/services/LawApiClient.ts', 'utf-8');

const regex = /\} else \{\s*beforeText = \`\[제1조\] \$\{lawName\} 기존 규정[\\s\\S]*?\(신설\)\`;\s*\}/;

const newBlock = `} else {
      beforeText = \`[데이터 수집 중...] \\n현재 OpenAPI IP 제한으로 인해 '\${lawName}'의 상세 개정 전 내용을 불러오지 못했습니다.\`;
      afterText = \`[데이터 수집 중...] \\n현재 OpenAPI IP 제한으로 인해 '\${lawName}'의 상세 개정 후 내용을 불러오지 못했습니다.\`;
    }`;

content = content.replace(regex, newBlock);
fs.writeFileSync('server/services/LawApiClient.ts', content);
console.log("Replaced else block");
