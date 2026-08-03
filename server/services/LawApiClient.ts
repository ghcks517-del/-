import axios from "axios";
import { parseStringPromise } from "xml2js";

const BASE_URL = "http://www.law.go.kr/DRF/lawSearch.do";
const DETAIL_URL = "http://www.law.go.kr/DRF/lawService.do";

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
  getOC() {
    return process.env.LAW_API_OC || process.env.LAW_API_KEY || "test";
  }

  async searchLaw(keyword: string) {
    const OC = this.getOC();
    try {
      const response = await axios.get(`${BASE_URL}?target=law&query=${encodeURIComponent(keyword)}&type=XML&OC=${OC}`);
      const parsed = await parseStringPromise(response.data);
      if (parsed.LawSearch && parsed.LawSearch.law) {
        return parsed.LawSearch.law.map((l: any) => ({
          lawId: l['법령ID']?.[0] || "",
          lawName: l['법령명한글']?.[0] || keyword,
          promulgationDate: l['공포일자']?.[0] || "",
          enforcementDate: l['시행일자']?.[0] || ""
        }));
      }
    } catch (err) {
      console.error("searchLaw api error", err);
    }
    return [];
  }

  async getRecentRevisions(lawName: string, regulationType: string, targetYear?: number, targetMonth?: number): Promise<NormalizedLawRevision[]> {
    const OC = this.getOC();
    const now = new Date();
    const yyyy = targetYear || now.getFullYear();
    const mm = String(targetMonth || (now.getMonth() + 1)).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");

    let promulgationDate = `${yyyy}-${mm}-${dd}`;
    let enforcementDate = `${yyyy}-${mm}-${String(parseInt(dd) + 7).padStart(2, '0')}`;
    let beforeText = "";
    let afterText = "";
    let revisionType = "일부개정";
    let sourceLawId = `mock-lawid-${lawName}`;

    try {
      const response = await axios.get(`${BASE_URL}?target=law&query=${encodeURIComponent(lawName)}&type=XML&OC=${OC}`);
      const parsed = await parseStringPromise(response.data);
      
      if (parsed.Response && parsed.Response.result && parsed.Response.result[0].includes("사용자 정보 검증에 실패")) {
         return [{
          sourceLawId, lawName, regulationType: regulationType as any,
          promulgationDate, enforcementDate,
          revisionId: `rev-${yyyy}${mm}${dd}-${Math.floor(Math.random()*1000)}`,
          revisionType,
          beforeText: `[OpenAPI 연동 실패]\n등록하신 OpenAPI 키(LAW_API_OC) 또는 IP가 국가법령정보센터에 등록되지 않았습니다.\n(오류메시지: ${parsed.Response.msg?.[0] || '사용자 정보 검증에 실패하였습니다.'})`,
          afterText: `[OpenAPI 연동 실패]\n국가법령정보센터에서 OpenAPI 키와 서버 IP(Vercel 서버 IP)를 다시 확인해 주세요.`,
          sourceUrl: "http://www.law.go.kr", collectedAt: new Date().toISOString()
         }];
      }

      if (parsed.LawSearch && parsed.LawSearch.law && parsed.LawSearch.law.length > 0) {
        const law = parsed.LawSearch.law[0];
        sourceLawId = law['법령ID']?.[0] || sourceLawId;
        const actualLawName = law['법령명한글']?.[0] || lawName;
        promulgationDate = law['공포일자']?.[0] || promulgationDate;
        enforcementDate = law['시행일자']?.[0] || enforcementDate;
        revisionType = law['제개정구분명']?.[0] || revisionType;

        // Fetch detail
        try {
          const detailRes = await axios.get(`${DETAIL_URL}?target=law&ID=${sourceLawId}&type=XML&OC=${OC}`);
          const detailParsed = await parseStringPromise(detailRes.data);
          if (detailParsed['법령'] && detailParsed['법령']['조문']) {
            const jomuns = detailParsed['법령']['조문'][0]['조문단위'] || [];
            let content = `[${actualLawName} 개정 본문]\n`;
            for (let i = 0; i < Math.min(10, jomuns.length); i++) {
              if (jomuns[i]['조문내용'] && jomuns[i]['조문내용'][0]) {
                 content += jomuns[i]['조문내용'][0].trim() + '\n';
              }
            }
            afterText = content;
            beforeText = `[이전 법령 조회]\n국가법령정보센터 OpenAPI에서는 이전 법령 본문을 별도로 조회하는 기능이 제한적입니다.\n해당 개정안의 시행 전 조문은 법제처 홈페이지에서 확인 가능합니다.\n\n개정일자: ${promulgationDate}\n시행일자: ${enforcementDate}`;
          }
        } catch (detailErr) {
          afterText = `법령 본문 상세 조회에 실패했습니다. (API 오류)`;
          beforeText = `법령 본문 상세 조회에 실패했습니다.`;
        }
      } else {
        beforeText = `검색된 법령이 없습니다. ('${lawName}')`;
        afterText = `검색된 법령이 없습니다.`;
      }

    } catch (err: any) {
      console.error("OpenAPI error", err);
      beforeText = `OpenAPI 통신 오류: ${err.message}`;
      afterText = `OpenAPI 통신 오류: ${err.message}`;
    }

    return [
      {
        sourceLawId,
        lawName,
        regulationType: regulationType as any,
        promulgationDate,
        enforcementDate,
        revisionId: `rev-${sourceLawId}-${promulgationDate}`,
        revisionType,
        beforeText,
        afterText,
        sourceUrl: `https://www.law.go.kr/lsInfoP.do?lsiSeq=${sourceLawId}`,
        collectedAt: new Date().toISOString()
      }
    ];
  }
}
