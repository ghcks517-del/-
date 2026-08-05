import fs from 'fs';
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');
content = content.replace(
    '    </div>\n\n      {showExportModal && (',
    '      {showExportModal && ('
);
content = content.replace(
    '        </div>\n      )}\n  );\n}',
    '        </div>\n      )}\n    </div>\n  );\n}'
);
fs.writeFileSync('src/pages/Dashboard.tsx', content);
