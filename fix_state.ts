import fs from 'fs';
let content = fs.readFileSync('src/pages/RevisionHistory.tsx', 'utf-8');

content = content.replace(
  'setRevisions(revisions.filter(r => !selectedItems.has(r.id)));',
  'setRevisions(prev => prev.filter(r => !selectedItems.has(r.id)));'
);

fs.writeFileSync('src/pages/RevisionHistory.tsx', content);
