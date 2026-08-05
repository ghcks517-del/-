const diff = require('diff');
const b = "제1조(목적) 이 법은 어쩌구저쩌구\n";
const a = "제1조(목적) 이 법은 어쩌구저쩌구\n제2조(신설) 새로운 조항입니다.\n";
const lineDiffs = diff.diffLines(b, a);
console.log(lineDiffs);
