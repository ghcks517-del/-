import fs from 'fs';
let content = fs.readFileSync('src/pages/RevisionHistory.tsx', 'utf-8');

content = content.replace(
  '// fallback to generic diffLines',
  '// fallback to generic diffLines\n  const lineDiffs = diff.diffLines(before, after);'
);

fs.writeFileSync('src/pages/RevisionHistory.tsx', content);
