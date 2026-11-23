import axios from "axios";
import { parseStringPromise } from "xml2js";

const BASE_URL = "https://www.law.go.kr/DRF/lawSearch.do";
const DETAIL_URL = "https://www.law.go.kr/DRF/lawService.do";
const DEFAULT_TEST_OC = "test";
const DEFAULT_TEST_REFERER = "https://www.law.go.kr";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

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

interface ApiAuthConfig {
  oc: string;
  referer: string;
}

export class LawApiClient {
  private getPrimaryAuth(): ApiAuthConfig {
    const envOc = process.env.LAW_API_OC?.trim();
    if (envOc && envOc !== "your_open_api_client_id" && envOc !== DEFAULT_TEST_OC) {
      const envReferer =
        process.env.LAW_API_REFERER?.trim() ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : DEFAULT_TEST_REFERER);
      return { oc: envOc, referer: envReferer };
    }
    return { oc: DEFAULT_TEST_OC, referer: DEFAULT_TEST_REFERER };
  }

  private getFallbackAuth(): ApiAuthConfig {
    return { oc: DEFAULT_TEST_OC, referer: DEFAULT_TEST_REFERER };
  }

  private extractAuthError(parsed: any): string | null {
    if (parsed?.Response?.result?.[0]?.includes("사용자 정보 검증에 실패")) {
      return parsed.Response.msg?.[0] || parsed.Response.result[0];
    }
    return null;
  }

  private async fetchXml(urlTemplate: (oc: string) => string, auth: ApiAuthConfig): Promise<{ parsed: any; authUsed: ApiAuthConfig }> {
    const requestWithAuth = async (currentAuth: ApiAuthConfig) => {
      const response = await axios.get(urlTemplate(currentAuth.oc), {
        headers: {
          Referer: currentAuth.referer,
          "User-Agent": USER_AGENT,
        },
        timeout: 15000,
      });
      return parseStringPromise(response.data);
    };

    const parsed = await requestWithAuth(auth);
    const authError = this.extractAuthError(parsed);

    if (authError && auth.oc !== DEFAULT_TEST_OC) {
      const fallback = this.getFallbackAuth();
      const fallbackParsed = await requestWithAuth(fallback);
      const fallbackError = this.extractAuthError(fallbackParsed);
      if (fallbackError) {
        throw new Error(`국가법령정보 OpenAPI 인증 실패: ${fallbackError}`);
      }
      return { parsed: fallbackParsed, authUsed: fallback };
    }

    if (authError) {
      throw new Error(`국가법령정보 OpenAPI 인증 실패: ${authError}`);
    }

    return { parsed, authUsed: auth };
  }

  async searchLaw(keyword: string) {
    const auth = this.getPrimaryAuth();
    try {
      const { parsed } = await this.fetchXml(
        (oc) => `${BASE_URL}?target=law&query=${encodeURIComponent(keyword)}&type=XML&OC=${oc}&sort=ddes`,
        auth
      );
      if (parsed.LawSearch && parsed.LawSearch.law) {
        return parsed.LawSearch.law.map((l: any) => ({
          lawId: l["법령ID"]?.[0] || "",
          lawName: l["법령명한글"]?.[0] || keyword,
          promulgationDate: l["공포일자"]?.[0] || "",
          enforcementDate: l["시행일자"]?.[0] || "",
        }));
      }
    } catch (err) {
      console.error("searchLaw api error", err);
    }
    return [];
  }

  async getRecentRevisions(
    lawName: string,
    regulationType: string,
    targetYear?: number,
    targetMonth?: number
  ): Promise<NormalizedLawRevision[]> {
    const auth = this.getPrimaryAuth();
    const now = new Date();
    const yyyy = targetYear || now.getFullYear();
    const monthNum = targetMonth || now.getMonth() + 1;
    const mm = String(monthNum).padStart(2, "0");
    const lastDay = String(new Date(yyyy, monthNum, 0).getDate()).padStart(2, "0");
    const ancYd = `${yyyy}${mm}01~${yyyy}${mm}${lastDay}`;

    const q = encodeURIComponent(lawName);

    const [lawRes, eflawRes] = await Promise.all([
      this.fetchXml(
        (oc) => `${BASE_URL}?target=law&query=${q}&type=XML&OC=${oc}&display=100&sort=ddes&ancYd=${ancYd}`,
        auth
      ),
      this.fetchXml(
        (oc) => `${BASE_URL}?target=eflaw&query=${q}&type=XML&OC=${oc}&display=100&sort=ddes&ancYd=${ancYd}`,
        auth
      ),
    ]);

    const parsedLaw = lawRes.parsed;
    const parsedEflaw = eflawRes.parsed;
    const activeAuth = lawRes.authUsed;

    let allLaws: any[] = [];
    if (parsedLaw.LawSearch && parsedLaw.LawSearch.law) allLaws = allLaws.concat(parsedLaw.LawSearch.law);
    if (parsedEflaw.LawSearch && parsedEflaw.LawSearch.law) allLaws = allLaws.concat(parsedEflaw.LawSearch.law);

    if (allLaws.length === 0) {
      return [];
    }

    const uniqueLawsMap = new Map();
    for (const l of allLaws) {
      uniqueLawsMap.set(l["법령일련번호"]?.[0], l);
    }
    allLaws = Array.from(uniqueLawsMap.values());

    const targetYearStr = yyyy.toString();
    const targetMonthStr = mm;

    const matchedLaws = allLaws.filter((l: any) => {
      const pDate = l["공포일자"]?.[0] || "";
      const actualName = l["법령명한글"]?.[0] || "";
      return (
        pDate.startsWith(`${targetYearStr}${targetMonthStr}`) &&
        actualName.replace(/ /g, "") === lawName.replace(/ /g, "")
      );
    });

    if (matchedLaws.length === 0) {
      return [];
    }

    const results: NormalizedLawRevision[] = [];

    for (const law of matchedLaws) {
      const mSourceLawId = law["법령ID"]?.[0] || `lawid-${lawName}`;
      const actualLawName = law["법령명한글"]?.[0] || lawName;
      const mPromulgationDate = law["공포일자"]?.[0] || `${yyyy}${mm}01`;
      const mEnforcementDate = law["시행일자"]?.[0] || mPromulgationDate;
      const mRevisionType = law["제개정구분명"]?.[0] || "일부개정";

      let mBeforeText = "";
      let mAfterText = "";

      try {
        const mst = law["법령일련번호"]?.[0] || "";
        const { parsed: oldAndNewParsed } = await this.fetchXml(
          (oc) => `${DETAIL_URL}?target=oldAndNew&ID=${mSourceLawId}&MST=${mst}&type=XML&OC=${oc}`,
          activeAuth
        );

        if (
          oldAndNewParsed.OldAndNewService &&
          oldAndNewParsed.OldAndNewService.구조문목록 &&
          oldAndNewParsed.OldAndNewService.신조문목록 &&
          oldAndNewParsed.OldAndNewService.신구법존재여부?.[0] !== "N"
        ) {
          const oldJomuns = oldAndNewParsed.OldAndNewService.구조문목록[0].조문 || [];
          const newJomuns = oldAndNewParsed.OldAndNewService.신조문목록[0].조문 || [];

          const cleanHtml = (str: string) => {
            if (!str) return "";
            return str
              .replace(/<신\s*설>/gi, "[신설]")
              .replace(/<생\s*략>/gi, "[생략]")
              .replace(/<삭\s*제>/gi, "[삭제]")
              .replace(/<P>/gi, "{|")
              .replace(/<\/P>/gi, "|}\n")
              .replace(/&nbsp;/g, " ")
              .replace(/<br\s*\/?>/gi, "\n")
              .replace(/<[^>]+>/g, "")
              .trim();
          };

          const cleanHtmlBasic = (str: string) => {
            if (!str) return "";
            return str.replace(/<[^>]+>/g, "").trim();
          };

          const length = Math.max(oldJomuns.length, newJomuns.length);
          for (let i = 0; i < length; i++) {
            let oldStr = oldJomuns[i]?._ || "";
            let newStr = newJomuns[i]?._ || "";

            if (/<신\s*설>/i.test(oldStr)) {
              const cleanNew = cleanHtmlBasic(newStr);
              let label = "신설";
              if (/^제\d+조/.test(cleanNew)) label = "조항 신설";
              else if (/^[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮]/.test(cleanNew)) label = "항 신설";
              else if (/^\d+\./.test(cleanNew)) label = "호 신설";
              else if (/^[가-하]\./.test(cleanNew)) label = "목 신설";

              oldStr = oldStr.replace(/<신\s*설>/gi, `[${label}]`);
            }

            if (/<삭\s*제>/i.test(newStr)) {
              const cleanOld = cleanHtmlBasic(oldStr);
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
          const { parsed: detailParsed } = await this.fetchXml(
            (oc) => `${DETAIL_URL}?target=law&ID=${mSourceLawId}&MST=${mst}&type=XML&OC=${oc}`,
            activeAuth
          );

          if (detailParsed["법령"] && detailParsed["법령"]["조문"]) {
            const jomuns = detailParsed["법령"]["조문"][0]["조문단위"] || [];
            let content = `[${actualLawName} 개정 본문 (신구조문 대비표 미제공)]\n`;
            for (let i = 0; i < Math.min(15, jomuns.length); i++) {
              if (jomuns[i]["조문내용"] && jomuns[i]["조문내용"][0]) {
                let cleanContent = jomuns[i]["조문내용"][0].trim();
                cleanContent = cleanContent.replace(/<[^>]+>/g, "");
                content += cleanContent + "\n";
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
        console.error(`Failed to fetch detail for ${actualLawName}:`, detailErr);
        mAfterText = `법령 본문 상세 조회에 실패했습니다. (API 오류)`;
        mBeforeText = `법령 본문 상세 조회에 실패했습니다.`;
      }

      results.push({
        sourceLawId: mSourceLawId,
        lawName: actualLawName,
        regulationType: regulationType as any,
        promulgationDate: mPromulgationDate,
        enforcementDate: mEnforcementDate,
        revisionId: `rev-${mSourceLawId}-${mPromulgationDate}-${Math.floor(Math.random() * 1000)}`,
        revisionType: mRevisionType,
        beforeText: mBeforeText,
        afterText: mAfterText,
        diffData: "",
        sourceUrl: `https://www.law.go.kr/lsInfoP.do?lsiSeq=${law["법령일련번호"]?.[0] || mSourceLawId}`,
        collectedAt: new Date().toISOString(),
      });
    }

    return results;
  }
}
