import fs from 'fs';
let content = fs.readFileSync('src/services/ExcelExportService.ts', 'utf-8');
content = content.replace(
    /static async exportRevisions\(revisions: Revision\[\], filenamePrefix = "법규개정현황"\) \{/,
    'static async exportRevisions(revisions: any[], notices: any[] = [], filenamePrefix = "법규개정현황") {'
);
content = content.replace(
    /if \(\!revisions \|\| revisions\.length === 0\) \{/,
    'if ((!revisions || revisions.length === 0) && (!notices || notices.length === 0)) {'
);
fs.writeFileSync('src/services/ExcelExportService.ts', content);
