import fs from 'fs';
let content = fs.readFileSync('server/services/SyncService.ts', 'utf-8');

content = content.replace(
  'diffData: "",',
  'diffData: rev.diffData || "",'
);

fs.writeFileSync('server/services/SyncService.ts', content);
