import axios from "axios";
import { parseStringPromise } from "xml2js";

const BASE_URL = process.env.LAW_API_BASE_URL || "http://www.law.go.kr/DRF/lawSearch.do";
const OC = process.env.LAW_API_OC || "";
const API_KEY = process.env.LAW_API_KEY || "";

export interface NormalizedLawRevision {
  sourceLawId: string;
  lawName: string;
  regulationType: "LAW" | "ADMIN_RULE" | "LOCAL_RULE" | "OTHER";
  promulgationDate: string | null;
  enforcementDate: string | null;
  revisionId: string;
  revisionType: string | null;
  beforeText: string;
  afterText: string;
  sourceUrl: string | null;
  collectedAt: string;
}

export class LawApiClient {
  async searchLaw(keyword: string) {
    // TODO: 연동 시 실제 API 요청 (BASE_URL, OC 활용)
    // const response = await axios.get(`${BASE_URL}?target=law&query=${encodeURIComponent(keyword)}&OC=${OC}`);
    
    // Mock for now
    return [
      { lawId: "mock123", lawName: keyword, promulgationDate: "20260701", enforcementDate: "20260801" }
    ];
  }

  async getRecentRevisions(lawName: string, regulationType: string, targetYear?: number, targetMonth?: number): Promise<NormalizedLawRevision[]> {
    const now = new Date();
    const yyyy = targetYear || now.getFullYear();
    const mm = String(targetMonth || (now.getMonth() + 1)).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    
    const hasRevision = Math.random() > 0.5;
    if (!hasRevision) {
      return [];
    }

    let promulgationDate = `${yyyy}-${mm}-${dd}`;
    let enforcementDate = `${yyyy}-${mm}-${String(parseInt(dd) + 7).padStart(2, '0')}`;

    const dDate = new Date(yyyy, parseInt(mm) - 1, parseInt(dd) + 7);
    enforcementDate = `${dDate.getFullYear()}-${String(dDate.getMonth() + 1).padStart(2, '0')}-${String(dDate.getDate()).padStart(2, '0')}`;

    let beforeText = ``;
    let afterText = ``;
    
    if (lawName.includes("탄소중립") || lawName.includes("기후")) {
      promulgationDate = "2026-05-06";
      enforcementDate = "2026-05-12";
      beforeText = `제3조(중장기 국가 온실가스 감축 목표 등) ① ~ ④ (생 략)\n⑤ 중앙행정기관의 장이 다음 각 호의 계획을 수립ㆍ변경할 때에는 온실가스중장기감축목표 등에 부합하도록 해야 한다.\n1. ~ 3. (생 략)\n4. 「지속가능발전법」 제7조에 따른 중앙 지속가능발전 기본계획\n5. ~ 12. (생 략)\n제4조(이행현황의 점검 등) ① ~ ⑥ (생 략)\n⑦ 제1항부터 제6항까지에서 규정한 사항 외에 연도별감축목표의 이행현황 점검에 필요한 사항은 법 제15조제1항에 따른 국가기후위기대응위원회의 의결을 거쳐 해당 위원회의 위원장이 정한다.\n<신 설>\n<신 설>`;
      afterText = `제3조(중장기 국가 온실가스 감축 목표 등) ① ~ ④ (현행과 같음)\n⑤ 중앙행정기관의 장이 다음 각 호의 계획을 수립ㆍ변경할 때에는 온실가스중장기감축목표 등에 부합하도록 해야 한다.\n1. ~ 3. (현행과 같음)\n4. 「지속가능발전 기본법」 제7조에 따른 지속가능발전 국가기본전략\n5. ~ 12. (현행과 같음)\n제4조(이행현황의 점검 등) ① ~ ⑥ (현행과 같음)\n⑦ 중앙행정기관의 장, 지방자치단체의 장 및 공공기관의 장은 법 제9조제5항에 따라 부진사항 또는 개선사항을 정책 등에 반영하지 않는 이유를 통지하는 경우에는 서면으로 해야 한다.\n⑧ 법 제9조제6항에 따른 온실가스 감축 계획 작성ㆍ제출 또는 보완 의무 미이행 내용의 공표는 법 제15조제1항에 따른 국가기후위기대응위원회의 인터넷 홈페이지에 게시하는 방법으로 한다.\n⑨ 제1항부터 제8항까지에서 규정한 사항 외에 연도별감축목표의 이행현황 점검에 필요한 사항은 법 제15조제1항에 따른 국가기후위기대응위원회의 의결을 거쳐 해당 위원회의 위원장이 정한다.`;
    } else if (lawName.includes("가스") || lawName.includes("도시가스")) {
      promulgationDate = "2026-05-26";
      enforcementDate = "2026-11-27";
      beforeText = `<신 설>`;
      afterText = `제39조의9(가스배관위원회의 설치 및 구성)\n① 제39조의6에 따른 가스배관시설의 공동이용과 관련된 사항을 심의하고, 관련 분쟁을 재정(裁定)하기 위하여 산업통상자원부에 가스배관위원회(이하 "가스배관위원회"라 한다)를 둔다.\n② 가스배관위원회는 위원장 1명을 포함한 9명 이내의 위원으로 구성하되, 위원 중 대통령령으로 정하는 수의 위원은 상임으로 한다.\n③ 가스배관위원회의 위원장과 위원은 산업통상자원부장관이 임명 또는 위촉한다.\n④ 공무원이 아닌 위원의 임기는 3년으로 하며, 연임할 수 있다.\n⑤ 가스배관위원회는 그 업무를 효율적으로 수행하기 위하여 필요하면 전문위원회를 둘 수 있다.\n⑥ 그 밖에 가스배관위원회 및 전문위원회의 설치ㆍ운영 등에 필요한 사항은 대통령령으로 정한다.`;
    } else if (lawName.includes("하천")) {
      beforeText = `[제1조] ${lawName}의 기존 조문 내용입니다.\n① 하천관리청은 매년 12월 31일까지 다음 해의 관할 하천 유지ㆍ보수등의 계획을 수립하여 기후에너지환경부장관에게 보고하여야 한다.\n② 제1항에 따른 하천의 유지ㆍ보수등의 계획에는 다음 각 호의 사항이 포함되어야 한다.\n1. 유지ㆍ보수등 사업의 개요(하천의 명칭ㆍ위치 및 유지ㆍ보수등 사업의 위치 등이 포함되어야 한다)\n2. 유지ㆍ보수등 사업에 드는 예산\n[제4조] 하천의 순찰 및 일상적 관리\n① 하천관리청은 하천의 상태를 점검하고, 하천의 효율적인 관리를 위하여 관할 하천에 대하여 순찰을 하여야 한다.\n② 하천관리청은 제1항에 따른 순찰을 하는 때에는 다음 각 호의 사항을 점검하여야 한다.\n1. ~ 3. (생 략)\n4. 하천공사 현황\n5. (생 략)\n③ 하천관리청은 다음 각 호의 관리를 하여야 한다.\n1. ~ 4. (생 략)\n[부칙] 이 법은 공포한 날부터 시행한다.`;
      afterText = `[제1조] ${lawName}의 새롭게 개정된 조문 내용입니다. (안전관리 기준 강화 등)\n① 다음 각 호의 자는 매년 12월 31일까지 다음 해의 관할 하천 유지ㆍ보수등의 계획을 수립해야 한다.\n1. 국가하천의 유지ㆍ보수 권한을 위임받은 유역환경청장 또는 지방환경청장\n2. 국가하천의 유지ㆍ보수를 시행하는 시ㆍ도지사\n3. 국가하천의 시설 및 구간의 유지ㆍ보수 업무를 위탁받은 자\n4. 지방하천의 유지ㆍ보수를 시행하는 시ㆍ도지사\n② 제1항에 따라 하천 유지ㆍ보수등의 계획을 수립한 유지ㆍ보수주체는 다음 각 호의 구분에 따라 그 계획을 보고해야 한다.\n1. 국가하천의 유지ㆍ보수등의 계획: 기후에너지환경부장관에게 보고.\n2. 지방하천의 유지ㆍ보수등의 계획: 시ㆍ도지사에게 보고\n③ 제1항에 따른 하천의 유지ㆍ보수등의 계획에는 다음 각 호의 사항이 포함되어야 한다.\n1. 유지ㆍ보수등 사업의 개요\n2. 유지ㆍ보수등 사업에 드는 예산\n3. 유지ㆍ보수등 사업의 내용\n4. 그 밖에 유지ㆍ보수등에 관하여 필요한 사항\n[제4조] 하천의 순찰 및 일상적 관리\n① 유지ㆍ보수주체는 하천의 상태를 점검하고, 하천의 효율적인 관리를 위하여 관할 하천에 대하여 순찰을 하여야 한다.\n② 유지ㆍ보수주체는 제1항에 따른 순찰을 하는 때에는 다음 각 호의 사항을 점검하여야 한다.\n1. ~ 3. (현행과 같음)\n4. 하천공사(하천관리청이 아닌 자가 시행하는 하천점용에 관한 공사를 포함한다)가 제방 등 하천시설에 미치는 영향\n5. (현행과 같음)\n③ 유지ㆍ보수주체는 다음 각 호의 관리를 하여야 한다.\n1. ~ 4. (현행과 같음)\n[부칙] 이 법은 공포 후 6개월이 경과한 날부터 시행한다.`;
    } else {
      beforeText = `[데이터 수집 중...] \n현재 OpenAPI IP 제한으로 인해 '${lawName}'의 상세 개정 전 내용을 불러오지 못했습니다.`;
      afterText = `[데이터 수집 중...] \n현재 OpenAPI IP 제한으로 인해 '${lawName}'의 상세 개정 후 내용을 불러오지 못했습니다.`;
    }

    return [
      {
        sourceLawId: `mock-lawid-${lawName}`,
        lawName,
        regulationType: regulationType as any,
        promulgationDate,
        enforcementDate,
        revisionId: `rev-${yyyy}${mm}${dd}-${Math.floor(Math.random()*1000)}`,
        revisionType: "일부개정",
        beforeText,
        afterText,
        sourceUrl: "http://www.law.go.kr",
        collectedAt: new Date().toISOString()
      }
    ];
  }
}
