import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic"; // Next.js 캐시 방지 (실시간 데이터용)

const PREFERRED_MODELS = [
  // 우선순위: 빠르고 안정적인 Flash 계열 먼저
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  // 대안(고성능)
  "gemini-2.5-pro",
  "gemini-2.0-pro",
  "gemini-1.5-pro",
];

async function pickGenerateContentModel(apiKey: string): Promise<string> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      { cache: "no-store" }
    );

    if (!res.ok) throw new Error(`ListModels HTTP ${res.status}`);

    const data = await res.json();
    const models: Array<any> = data?.models ?? [];

    // generateContent 지원 모델만 추림
    const usable = models.filter((m) =>
      (m.supportedGenerationMethods ?? []).includes("generateContent")
    );

    // 우선순위 모델이 있으면 그걸 선택
    for (const name of PREFERRED_MODELS) {
      const found = usable.find((m) => m.name === `models/${name}`);
      if (found) return name;
    }

    // 우선순위가 없으면 usable 첫 번째를 사용
    // m.name은 "models/xxx" 형태라서 prefix 제거
    if (usable.length > 0) return String(usable[0].name).replace(/^models\//, "");

    // 아무것도 없으면 최후 fallback
    return "gemini-2.5-flash";
  } catch {
    // ListModels가 막혀있거나 실패해도 기본 모델로 시도
    return "gemini-2.5-flash";
  }
}

export async function GET(request: Request) {
  const SEOUL_KEY = process.env.SEOUL_DATA_KEY;
  const GEMINI_KEY = process.env.GOOGLE_API_KEY;

  if (!SEOUL_KEY || !GEMINI_KEY) {
    return NextResponse.json(
      { success: false, error: "API 키가 설정되지 않았습니다. .env.local을 확인하세요." },
      { status: 500 }
    );

  }// 1) URL에서 지역 파라미터 추출 (예: ?area=홍대)
  const { searchParams } = new URL(request.url);
  const area = searchParams.get("area") || "판교"; // 입력 없으면 기본값 '성수'

  try {
    // 1) 서울 실시간 데이터 수집 (캐시 방지)
    const crowdUrl = `http://openapi.seoul.go.kr:8088/${SEOUL_KEY}/json/citydata/1/1/${encodeURIComponent(area)}`;
    const dustUrl = `http://openapi.seoul.go.kr:8088/${SEOUL_KEY}/json/RealtimeCityAir/1/5/`;

    const [crowdRes, dustRes] = await Promise.all([
      fetch(crowdUrl, { cache: "no-store" }),
      fetch(dustUrl, { cache: "no-store" }),
    ]);

    if (!crowdRes.ok) throw new Error(`Seoul citydata HTTP ${crowdRes.status}`);
    if (!dustRes.ok) throw new Error(`Seoul air HTTP ${dustRes.status}`);
    
    const crowdData = await crowdRes.json();
    const dustData = await dustRes.json();

    // 2) 핵심 데이터 추출(구조가 달라도 최대한 버티게)
    const dustInfo = dustData?.RealtimeCityAir?.row?.[0] ?? {};

    // CITYDATA 구조가 환경/버전에 따라 달라질 수 있어 안전하게 접근
    const city = crowdData?.CITYDATA ?? crowdData?.CityData ?? {};
    const congestLvl =
      city?.AREA_CONGEST_LVL ??
      city?.LIVE_PPLTN_STTS?.[0]?.AREA_CONGEST_LVL ??
      "보통";

    // 3) Gemini 모델 자동 선택 + 호출
    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const modelName = await pickGenerateContentModel(GEMINI_KEY);

    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `
당신은 여행 애플리케이션 '채로(CHAE-RO)'의 다정한 로컬 가이드입니다.
아래 실시간 데이터를 바탕으로, 유저에게 지금 바로 써먹을 수 있는 조언을 구어체로 해주세요.

[현재 데이터]
- 장소: ${area}  <-- 여기가 포인트!
- 미세먼지 지수: ${dustInfo.CAI_IDX ?? "N/A"} (${dustInfo.CAI_GRD ?? "N/A"})
- 혼잡도: ${congestLvl}

[작성 가이드라인]
1. "~해요", "~ 어때요?" 처럼 친구 같은 다정한 말투를 쓸 것.
2. 날씨와 미세먼지 상태에 맞춰 우산, 실내 활동, 혹은 산책 중 하나를 추천할 것. 
3. ${area} 하면 떠오르는 대표 메뉴나 활동을 언급할 것.
`.trim();

    const result = await model.generateContent(prompt);
    const aiComment = result?.response?.text?.() ?? "";

    return NextResponse.json({
      success: true,
      data: {
        modelUsed: modelName, // 어떤 모델로 돌아갔는지 확인용
        location: "성수",
        status: {
          dust: dustInfo.CAI_GRD ?? null,
          congestion: congestLvl ?? null,
        },
        aiComment: aiComment.trim(),
      },
    });
  } catch (error: any) {
    console.error("Gemini/Seoul 수사 결과:", error);
    return NextResponse.json(
      {
        success: false,
        error: `엔진 에러 상세: ${error?.message ?? String(error)}`,
      },
      { status: 500 }
    );
  }
}