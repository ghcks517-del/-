const axios = require('axios');
async function test() {
  try {
    const res = await axios.get(`http://www.law.go.kr/DRF/lawService.do?target=law&ID=001836&type=XML&OC=test`);
    console.log("lawService", res.data.substring(0,500));
  } catch(e) {
    console.log(e.message);
  }
}
test();
