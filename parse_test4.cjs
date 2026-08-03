const axios = require('axios');
async function test() {
  try {
    const res = await axios.get(`http://www.law.go.kr/DRF/lawSearch.do?target=law&query=${encodeURIComponent('하천법')}&type=XML&OC=ghcks517`);
    console.log(res.data.substring(0,150));
  } catch(e) {
    console.log(e.message);
  }
}
test();
