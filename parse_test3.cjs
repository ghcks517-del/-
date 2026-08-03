const axios = require('axios');
async function test() {
  try {
    const res = await axios.get(`http://www.law.go.kr/DRF/lawSearch.do?target=newLaw&type=XML&OC=test`);
    console.log(res.data.substring(0,500));
  } catch(e) {
    console.log(e.message);
  }
}
test();
