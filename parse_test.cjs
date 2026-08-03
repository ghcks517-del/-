const axios = require('axios');
const xml2js = require('xml2js');

async function test() {
  const OC = 'ghcks517'; // I'll use the user's OC or let's use process.env.LAW_API_OC
  try {
    const res = await axios.get(`http://www.law.go.kr/DRF/lawSearch.do?target=law&query=${encodeURIComponent('하천법')}&type=XML&OC=test`);
    console.log("lawSearch", res.data.substring(0,200));
  } catch(e) {
    console.log(e.message);
  }
}
test();
