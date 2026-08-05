import axios from 'axios';
import { parseStringPromise } from 'xml2js';

async function run() {
    const BASE = "http://www.law.go.kr/DRF/lawSearch.do";
    const DETAIL = "http://www.law.go.kr/DRF/lawService.do";
    const OC = "test";
    
    // search
    const res = await axios.get(`${BASE}?target=law&query=${encodeURIComponent("산업안전보건법")}&type=XML&OC=${OC}`);
    const parsed = await parseStringPromise(res.data);
    const law = parsed.LawSearch.law[0];
    const sourceLawId = law['법령ID'][0];
    const mst = law['법령일련번호'][0];
    
    console.log(sourceLawId, mst);
    
    // detail
    const oldAndNewRes = await axios.get(`${DETAIL}?target=oldAndNew&ID=${sourceLawId}&MST=${mst}&type=XML&OC=${OC}`);
    const oldAndNewParsed = await parseStringPromise(oldAndNewRes.data);
    
    if (oldAndNewParsed.OldAndNewService) {
        const oldJomuns = oldAndNewParsed.OldAndNewService.구조문목록[0].조문 || [];
        const newJomuns = oldAndNewParsed.OldAndNewService.신조문목록[0].조문 || [];
        
        console.log("Old count:", oldJomuns.length);
        console.log("New count:", newJomuns.length);
        
        for (let i = 0; i < Math.min(5, oldJomuns.length); i++) {
            console.log("OLD", i, oldJomuns[i]._);
            console.log("NEW", i, newJomuns[i]._);
        }
    }
}
run();
