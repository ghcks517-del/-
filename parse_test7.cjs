const axios = require('axios');
const xml2js = require('xml2js');

async function test() {
  const OC = 'test';
  const lsiSeq = '288431'; // From screenshot URL
  
  // Is there an API for this? 
  // Let's try target=lsOldAndNew or target=newlaw or target=eflaw
  const targets = ['newlaw', 'lsOldAndNew', 'oldAndNew', 'eflaw'];
  for (const t of targets) {
     try {
       console.log("Trying target:", t);
       const url = `http://www.law.go.kr/DRF/lawService.do?target=${t}&ID=${lsiSeq}&type=XML&OC=${OC}`;
       const res = await axios.get(url);
       console.log("Result for", t, ":", res.data.substring(0, 200));
     } catch (e) {
       console.log("Error for", t, e.message);
     }
  }
}
test();
