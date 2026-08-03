const axios = require('axios');
const xml2js = require('xml2js');

async function test() {
  const OC = 'test';
  const url = `http://www.law.go.kr/DRF/lawService.do?target=oldAndNew&ID=007364&MST=288431&type=XML&OC=${OC}`;
  const res = await axios.get(url);
  const parsed = await xml2js.parseStringPromise(res.data);
  
  const oldJomuns = parsed.OldAndNewService.구조문목록[0].조문;
  const newJomuns = parsed.OldAndNewService.신조문목록[0].조문;
  
  const cleanHtml = (str) => {
    if (!str) return "";
    return str.replace(/<P>/gi, '').replace(/<\/P>/gi, '\n').replace(/&nbsp;/g, ' ').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();
  };

  let beforeText = "";
  for (const j of oldJomuns) {
    beforeText += cleanHtml(j._) + "\n\n";
  }
  
  let afterText = "";
  for (const j of newJomuns) {
    afterText += cleanHtml(j._) + "\n\n";
  }
  
  console.log("BEFORE:");
  console.log(beforeText.substring(0, 500));
  console.log("-------------------");
  console.log("AFTER:");
  console.log(afterText.substring(0, 500));
}
test();
