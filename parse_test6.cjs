const axios = require('axios');
const xml2js = require('xml2js');

async function test() {
  const OC = 'test';
  const url = `http://www.law.go.kr/DRF/lawSearch.do?target=law&query=${encodeURIComponent('하천법')}&type=XML&OC=${OC}`;
  try {
    const res = await axios.get(url);
    const parsed = await xml2js.parseStringPromise(res.data);
    const laws = parsed.LawSearch.law;
    console.log(laws.map(l => l['공포일자']?.[0]));
  } catch (e) {
    console.error(e.message);
  }
}
test();
