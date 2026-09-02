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
  diffData: string;
  sourceUrl: string | null;
  collectedAt: string;
}

export class LawApiClient {
  getOC() {
    // Vercel 환경에서는 유동 IP를 사용하므로 개인 API 키(LAW_API_OC) 사용 시 IP 검증에 실패합니다.
    // 따라서 IP 검증을 하지 않는 테스트용 키('test')를 고정으로 사용하도록 수정합니다.
    return "test";
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
    let revisionType = "일부개정";
    let sourceLawId = `mock-lawid-${lawName}`;
    let diffData = "";

    try {
      const q = encodeURIComponent(lawName);
      
      const [resLaw, resEflaw] = await Promise.all([
         axios.get(`${BASE_URL}?target=law&query=${q}&type=XML&OC=${OC}&display=100`),
         axios.get(`${BASE_URL}?target=eflaw&query=${q}&type=XML&OC=${OC}&display=100`)
      ]);
      
      const [parsedLaw, parsedEflaw] = await Promise.all([
         parseStringPromise(resLaw.data),
         parseStringPromise(resEflaw.data)
      ]);
      
      let errorMsg = null;
      if (parsedLaw.Response && parsedLaw.Response.result && parsedLaw.Response.result[0].includes("사용자 정보 검증에 실패")) {
          errorMsg = parsedLaw.Response.msg?.[0];
      } else if (parsedEflaw.Response && parsedEflaw.Response.result && parsedEflaw.Response.result[0].includes("사용자 정보 검증에 실패")) {
          errorMsg = parsedEflaw.Response.msg?.[0];
      }
      
      if (errorMsg) {
         return [{
          sourceLawId, lawName, regulationType: regulationType as any,
          promulgationDate, enforcementDate,
          revisionId: `rev-${yyyy}${mm}${dd}-${Math.floor(Math.random()*1000)}`,
          revisionType,
          beforeText: `[OpenAPI 연동 실패]\n등록하신 OpenAPI 키(LAW_API_OC) 또는 IP가 국가법령정보센터에 등록되지 않았습니다.\n(오류메시지: ${errorMsg || '사용자 정보 검증에 실패하였습니다.'})`,
          afterText: `[OpenAPI 연동 실패]\n국가법령정보센터에서 OpenAPI 키와 서버 IP(Vercel 서버 IP)를 다시 확인해 주세요.`,
          sourceUrl: "http://www.law.go.kr", collectedAt: new Date().toISOString(), diffData: "" 
         }];
      }

      let allLaws: any[] = [];
      if (parsedLaw.LawSearch && parsedLaw.LawSearch.law) allLaws = allLaws.concat(parsedLaw.LawSearch.law);
      if (parsedEflaw.LawSearch && parsedEflaw.LawSearch.law) allLaws = allLaws.concat(parsedEflaw.LawSearch.law);

      if (allLaws.length > 0) {
        
        const uniqueLawsMap = new Map();
        for (const l of allLaws) {
            uniqueLawsMap.set(l['법령일련번호']?.[0], l);
        }
        allLaws = Array.from(uniqueLawsMap.values());

        const targetYearStr = yyyy.toString();
        const targetMonthStr = mm; // already padded
        
        const matchedLaws = allLaws.filter((l: any) => {
           const pDate = l['공포일자']?.[0] || "";
           const actualName = l['법령명한글']?.[0] || "";
           return pDate.startsWith(`${targetYearStr}${targetMonthStr}`) && actualName.replace(/ /g, '') === lawName.replace(/ /g, '');
        });

        if (matchedLaws.length === 0) {
          return [];
        }

        const results: NormalizedLawRevision[] = [];

        for (const law of matchedLaws) {
          const mSourceLawId = law['법령ID']?.[0] || sourceLawId;
          const actualLawName = law['법령명한글']?.[0] || lawName;
          const mPromulgationDate = law['공포일자']?.[0] || promulgationDate;
          const mEnforcementDate = law['시행일자']?.[0] || enforcementDate;
          const mRevisionType = law['제개정구분명']?.[0] || revisionType;

          let mBeforeText = "";
          let mAfterText = "";

          // Fetch detail
          try {
            const mst = law['법령일련번호']?.[0] || '';
            const oldAndNewRes = await axios.get(`${DETAIL_URL}?target=oldAndNew&ID=${mSourceLawId}&MST=${mst}&type=XML&OC=${OC}`);
            const oldAndNewParsed = await parseStringPromise(oldAndNewRes.data);
            
            if (oldAndNewParsed.OldAndNewService && oldAndNewParsed.OldAndNewService.구조문목록 && oldAndNewParsed.OldAndNewService.신조문목록 && oldAndNewParsed.OldAndNewService.신구법존재여부?.[0] !== 'N') {
              const oldJomuns = oldAndNewParsed.OldAndNewService.구조문목록[0].조문 || [];
              const newJomuns = oldAndNewParsed.OldAndNewService.신조문목록[0].조문 || [];
              
              const cleanHtml = (str: string) => {
                if (!str) return "";
                return str.replace(/<신\s*설>/gi, '[신설]')
                          .replace(/<생\s*략>/gi, '[생략]')
                          .replace(/<삭\s*제>/gi, '[삭제]')
                          .replace(/<P>/gi, '{|')
                          .replace(/<\/P>/gi, '|}\n')
                          .replace(/&nbsp;/g, ' ')
                          .replace(/<br\s*\/?>/gi, '\n')
                          .replace(/<[^>]+>/g, '')
                          .trim();
              };
              
              const cleanHtmlBasic = (str: string) => {
                if (!str) return "";
                return str.replace(/<[^>]+>/g, '').trim();
              };

              const length = Math.max(oldJomuns.length, newJomuns.length);
              for (let i = 0; i < length; i++) {
                let oldStr = oldJomuns[i]?._ || "";
                let newStr = newJomuns[i]?._ || "";
                
                if (/<신\s*설>/i.test(oldStr)) {
                   let cleanNew = cleanHtmlBasic(newStr);
                   let label = "신설";
                   if (/^제\d+조/.test(cleanNew)) label = "조항 신설";
                   else if (/^[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮]/.test(cleanNew)) label = "항 신설";
                   else if (/^\d+\./.test(cleanNew)) label = "호 신설";
                   else if (/^[가-하]\./.test(cleanNew)) label = "목 신설";
                   
                   oldStr = oldStr.replace(/<신\s*설>/gi, `[${label}]`);
                }
                
                if (/<삭\s*제>/i.test(newStr)) {
                   let cleanOld = cleanHtmlBasic(oldStr);
                   let label = "삭제";
                   if (/^제\d+조/.test(cleanOld)) label = "조항 삭제";
                   else if (/^[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮]/.test(cleanOld)) label = "항 삭제";
                   else if (/^\d+\./.test(cleanOld)) label = "호 삭제";
                   else if (/^[가-하]\./.test(cleanOld)) label = "목 삭제";
                   
                   newStr = newStr.replace(/<삭\s*제>/gi, `[${label}]`);
                }

                if (oldStr || newStr) {
                  mBeforeText += cleanHtml(oldStr) + "\n\n";
                  mAfterText += cleanHtml(newStr) + "\n\n";
                }
              }

              mBeforeText = mBeforeText.trim() || "변경 전 내용 없음";
              mAfterText = mAfterText.trim() || "변경 후 내용 없음";
            } else {
              // Fallback to detail using target=law (since target=eflaw is restricted for test OC)
              const detailRes = await axios.get(`${DETAIL_URL}?target=law&ID=${mSourceLawId}&MST=${mst}&type=XML&OC=${OC}`);
              const detailParsed = await parseStringPromise(detailRes.data);
              
              if (detailParsed['법령'] && detailParsed['법령']['조문']) {
                const jomuns = detailParsed['법령']['조문'][0]['조문단위'] || [];
                let content = `[${actualLawName} 개정 본문 (신구조문 대비표 미제공)]\n`;
                for (let i = 0; i < Math.min(15, jomuns.length); i++) {
                  if (jomuns[i]['조문내용'] && jomuns[i]['조문내용'][0]) {
                     let cleanContent = jomuns[i]['조문내용'][0].trim();
                     // Apply formatting to make it look nicer even without diff
                     cleanContent = cleanContent.replace(/<[^>]+>/g, '');
                     content += cleanContent + '\n';
                  }
                }
                mAfterText = content;
                mBeforeText = `[이전 법령 조회 안내]\n국가법령정보센터 OpenAPI에서는 해당 법령의 이전 법령 본문을 별도로 제공하지 않습니다. (타법개정 또는 전부개정 등)\n해당 개정안의 상세 신구조문 대비표는 법제처 홈페이지에서 직접 확인 가능합니다.\n\n개정일자: ${mPromulgationDate}\n시행일자: ${mEnforcementDate}`;
              } else {
                 mBeforeText = "신구조문 대비표 제공 안 됨 (법제처 원문 참고 요망)";
                 mAfterText = "해당 개정건에 대한 본문 텍스트 제공 안 됨 (법제처 원문 참고 요망)";
              }
            }
          } catch (detailErr) {
            mAfterText = `법령 본문 상세 조회에 실패했습니다. (API 오류)`;
            mBeforeText = `법령 본문 상세 조회에 실패했습니다.`;
          }

          results.push({
            sourceLawId: mSourceLawId,
            lawName: actualLawName,
            regulationType: regulationType as any,
            promulgationDate: mPromulgationDate,
            enforcementDate: mEnforcementDate,
            revisionId: `rev-${mSourceLawId}-${mPromulgationDate}-${Math.floor(Math.random()*1000)}`,
            revisionType: mRevisionType,
            beforeText: mBeforeText,
            afterText: mAfterText,
            diffData,
            sourceUrl: `https://www.law.go.kr/lsInfoP.do?lsiSeq=${mSourceLawId}`,
            collectedAt: new Date().toISOString()
          });
        }
        
        return results;
      } else {
        return [];
      }
    } catch (err: any) {
      console.error("OpenAPI error", err);
      return [{
        sourceLawId,
        lawName,
        regulationType: regulationType as any,
        promulgationDate,
        enforcementDate,
        revisionId: `rev-${sourceLawId}-${promulgationDate}`,
        revisionType,
        beforeText: `OpenAPI 통신 오류: ${err.message}`,
        afterText: `OpenAPI 통신 오류: ${err.message}`,
        diffData, sourceUrl: `https://www.law.go.kr/lsInfoP.do?lsiSeq=${sourceLawId}`,
        collectedAt: new Date().toISOString()
      }];
    }
  }
}
