const axios = require('axios');
const xml2js = require('xml2js');

async function test() {
  const OC = 'test';
  
  const ids = ['007364', '288431'];
  const targets = ['newlaw', 'lsOldAndNew', 'oldAndNew', 'eflaw'];
  for (const id of ids) {
    for (const t of targets) {
       try {
         const url = `http://www.law.go.kr/DRF/lawService.do?target=${t}&ID=${id}&type=XML&OC=${OC}`;
         const res = await axios.get(url);
         const text = res.data.substring(0, 200);
         if (!text.includes("일치하는 신구법 없습니다") && !text.includes("일치하는 법령이 없습니다")) {
             console.log("Success! ID:", id, "target:", t);
             console.log(text);
         }
       } catch (e) {
       }
    }
  }
}
test();
