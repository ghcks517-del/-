import fs from 'fs';
let content = fs.readFileSync('server/services/LawApiClient.ts', 'utf-8');

if (!content.includes('diffData: string;')) {
  content = content.replace(
    'afterText: string;',
    'afterText: string;\n  diffData: string;'
  );
  fs.writeFileSync('server/services/LawApiClient.ts', content);
}
