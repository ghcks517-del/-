import fs from 'fs';
let content = fs.readFileSync('src/pages/RevisionHistory.tsx', 'utf-8');

const oldFilter = `
  const filteredRevisions = revisions.filter(rev => {
    if (searchKeyword && !rev.lawName.toLowerCase().includes(searchKeyword.toLowerCase())) {
       return false;
    }
    if (selectedYear !== "ALL" || selectedMonth !== "ALL") {
       const dateStr = rev.promulgationDate;
       if (!dateStr) return false;
       const [y, m, d] = dateStr.split("-");
       if (selectedYear !== "ALL" && y !== String(selectedYear)) return false;
       if (selectedMonth !== "ALL" && parseInt(m, 10) !== selectedMonth) return false;
    }
    return true;
  });
`.trim();

const newFilter = `
  const filteredRevisions = revisions.filter(rev => {
    if (searchKeyword && !rev.lawName.toLowerCase().includes(searchKeyword.toLowerCase())) {
       return false;
    }
    if (selectedYear !== "ALL" || selectedMonth !== "ALL") {
       const dateStr = rev.promulgationDate;
       if (!dateStr) return false;
       const [y, m, d] = dateStr.split("-");
       if (selectedYear !== "ALL" && y !== String(selectedYear)) return false;
       if (selectedMonth !== "ALL" && parseInt(m, 10) !== selectedMonth) return false;
    }
    return true;
  }).sort((a, b) => {
    const dateA = a.promulgationDate || "";
    const dateB = b.promulgationDate || "";
    return dateA.localeCompare(dateB);
  });
`.trim();

content = content.replace(oldFilter, newFilter);
fs.writeFileSync('src/pages/RevisionHistory.tsx', content);
