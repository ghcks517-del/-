import re

with open("server/services/LawApiClient.ts", "r") as f:
    content = f.read()

# I will just write a new version of the function and replace it entirely using regex.
new_func = """  async getRecentRevisions(lawName: string, regulationType: string, targetYear?: number, targetMonth?: number): Promise<NormalizedLawRevision[]> {
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
      const response = await axios.get(`${BASE_URL}?target=eflaw&query=${encodeURIComponent(lawName)}&type=XML&OC=${OC}&display=100`);
      const parsed = await parseStringPromise(response.data);
      
      if (parsed.Response && parsed.Response.result && parsed.Response.result[0].includes("사용자 정보 검증에 실패")) {
         return [{
          sourceLawId, lawName, regulationType: regulationType as any,
          promulgationDate, enforcementDate,
          revisionId: `rev-${yyyy}${mm}${dd}-${Math.floor(Math.random()*1000)}`,
          revisionType,
          beforeText: `[OpenAPI 연동 실패]\\n등록하신 OpenAPI 키(LAW_API_OC) 또는 IP가 국가법령정보센터에 등록되지 않았습니다.\\n(오류메시지: ${parsed.Response.msg?.[0] || '사용자 정보 검증에 실패하였습니다.'})`,
          afterText: `[OpenAPI 연동 실패]\\n국가법령정보센터에서 OpenAPI 키와 서버 IP(Vercel 서버 IP)를 다시 확인해 주세요.`,
          sourceUrl: "http://www.law.go.kr", collectedAt: new Date().toISOString(), diffData: ""
         }];
      }

      if (parsed.LawSearch && parsed.LawSearch.law && parsed.LawSearch.law.length > 0) {
        const targetYearStr = yyyy.toString();
        const targetMonthStr = mm; // already padded
        
        const matchedLaws = parsed.LawSearch.law.filter((l: any) => {
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
            
            if (oldAndNewParsed.OldAndNewService && oldAndNewParsed.OldAndNewService.구조문목록 && oldAndNewParsed.OldAndNewService.신조문목록) {
              const oldJomuns = oldAndNewParsed.OldAndNewService.구조문목록[0].조문 || [];
              const newJomuns = oldAndNewParsed.OldAndNewService.신조문목록[0].조문 || [];
              
              const cleanHtml = (str: string) => {
                if (!str) return "";
                return str.replace(/<신\s*설>/gi, '[신설]')
                          .replace(/<생\s*략>/gi, '[생략]')
                          .replace(/<삭\s*제>/gi, '[삭제]')
                          .replace(/<P>/gi, '')
                          .replace(/<\\/P>/gi, '\\n')
                          .replace(/&nbsp;/g, ' ')
                          .replace(/<br\s*\\/?>/gi, '\\n')
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
                  mBeforeText += cleanHtml(oldStr) + "\\n\\n";
                  mAfterText += cleanHtml(newStr) + "\\n\\n";
                }
              }
              mBeforeText = mBeforeText.trim() || "변경 전 내용 없음";
              mAfterText = mAfterText.trim() || "변경 후 내용 없음";
            } else {
              // Fallback to detail
              const detailRes = await axios.get(`${DETAIL_URL}?target=law&ID=${mSourceLawId}&MST=${mst}&type=XML&OC=${OC}`);
              const detailParsed = await parseStringPromise(detailRes.data);
              
              if (detailParsed['법령'] && detailParsed['법령']['조문']) {
                const jomuns = detailParsed['법령']['조문'][0]['조문단위'] || [];
                let content = `[${actualLawName} 개정 본문]\\n`;
                for (let i = 0; i < Math.min(10, jomuns.length); i++) {
                  if (jomuns[i]['조문내용'] && jomuns[i]['조문내용'][0]) {
                     content += jomuns[i]['조문내용'][0].trim() + '\\n';
                  }
                }
                mAfterText = content;
                mBeforeText = `[이전 법령 조회]\\n국가법령정보센터 OpenAPI에서는 이전 법령 본문을 별도로 조회하는 기능이 제한적입니다.\\n해당 개정안의 시행 전 조문은 법제처 홈페이지에서 확인 가능합니다.\\n\\n개정일자: ${mPromulgationDate}\\n시행일자: ${mEnforcementDate}`;
              } else {
                 mBeforeText = "신구조문 대비표 제공 안 됨 (원문 참고)";
                 mAfterText = "신구조문 대비표 제공 안 됨 (원문 참고)";
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
"""

start_idx = content.find("  async getRecentRevisions")
if start_idx != -1:
    content = content[:start_idx] + new_func

with open("server/services/LawApiClient.ts", "w") as f:
    f.write(content)
