import * as diff from 'diff';
const b = "[조항 신설]\n";
const a = "제10조의2(안전보건 현황 공시) ...\n";
const lineDiffs = diff.diffLines(b, a);

let beforeRichText: any[] = [];
let afterRichText: any[] = [];
let pendingRemoved: any = null;
let pendingAdded: any = null;

const flush = () => {
    if (pendingRemoved || pendingAdded) {
        const bPart = pendingRemoved ? pendingRemoved.value.replace(/\n$/, '') : "";
        const aPart = pendingAdded ? pendingAdded.value.replace(/\n$/, '') : "";
        const wordDiffs = diff.diffWordsWithSpace(bPart, aPart);
        
        if (bPart) {
            wordDiffs.forEach(part => {
                if (part.added) return;
                beforeRichText.push({
                    text: part.value,
                    font: part.removed ? "RED" : "NORMAL"
                });
            });
        }
        if (aPart) {
            wordDiffs.forEach(part => {
                if (part.removed) return;
                afterRichText.push({
                    text: part.value,
                    font: part.added ? "BLUE" : "NORMAL"
                });
            });
        }
        pendingRemoved = null;
        pendingAdded = null;
    }
};

lineDiffs.forEach((part) => {
    if (part.added) {
        if (pendingAdded) flush();
        pendingAdded = part;
    } else if (part.removed) {
        if (pendingRemoved) flush();
        pendingRemoved = part;
    } else {
        flush();
    }
});
flush();
console.log("BEFORE:", JSON.stringify(beforeRichText));
console.log("AFTER:", JSON.stringify(afterRichText));
