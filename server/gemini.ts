import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function summarizeRevision(beforeText: string, afterText: string) {
  const prompt = `다음은 법령의 개정 전/후 원문입니다.
이 개정 사항의 핵심을 파악하여 다음 JSON 형식으로 정확히 출력하세요.
개정 전/후 원문에 명시적으로 나타나지 않은 내용은 절대 유추하여 적지 마시고, 빈 배열로 두거나 "원문에서 확인되지 않음"이라고 적어주세요.

다음 조건을 반드시 고려하여 개정 내용에 대한 회사의 대응 방안을 분석하세요.
[고려 조건]
- 업종: 300인 이상 특수목적용 기계 제조업
- 사업 형태: PJT(프로젝트)성 사업 운영

[JSON 출력 형식]
{
  "summary": "핵심 개정사항 요약 1-2줄",
  "addedObligations": ["신설된 의무 내용"],
  "removedObligations": ["삭제된 의무 내용"],
  "changedRequirements": ["변경된 기준 또는 기한"],
  "reviewPoints": ["회사가 검토해야 할 사항"],
  "departmentCheckpoints": ["관련 부서가 확인할 체크포인트"],
  "responsePlan": "고려 조건을 반영한 AI 대응 방안 분석 내용 (구체적이고 실무적인 대응 방안 제시)"
}

[개정 전 원문]
${beforeText}

[개정 후 원문]
${afterText}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
  } catch (error) {
    console.error("AI 요약 생성 중 오류 발생:", error);
  }
  return null;
}
