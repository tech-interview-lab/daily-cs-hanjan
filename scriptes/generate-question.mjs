// scripts/generate-question.mjs
//
// Gemini API(Google Search grounding)를 사용해
// 최신 개발자 기술면접 질문을 검색하고,
// 특정 기술 스택에 종속되지 않는 질문 1개로 필터링/재구성한다.
//

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY 환경변수가 설정되지 않았습니다.");
  process.exit(1);
}

const SYSTEM_PROMPT = `너는 신입~주니어 개발자 기술면접 질문 큐레이터다.

역할:
1. 웹 검색으로 "최근 신입/주니어 개발자 기술면접 기출 질문"이나 "요즘 뜨는 개발자 면접 트렌드"를 찾아라.
2. 검색된 질문/주제 중 아래 조건을 모두 만족하는 것만 선별하라:
   - 특정 프로그래밍 언어 문법이나 특정 프레임워크(React, Vue, Spring, Django 등) 세부 API를 직접 묻지 않을 것
   - 특정 클라우드 벤더(AWS, GCP, Azure 등) 특정 서비스명을 직접 묻지 않을 것
   - 아래 카테고리 중 하나에 해당할 것: CS기초, 네트워크, 데이터베이스, 시스템설계개념, AI/LLM개념, 협업/트러블슈팅 사고력
   - 앱/프론트엔드/백엔드/데브옵스/AI 직군 전원이 자기 방식으로 답할 수 있는 "개념 질문"일 것
3. 조건에 맞는 질문 1개를 선정해, 신입 면접 톤으로 자연스럽게 다듬어라.

반드시 아래 JSON 형식으로만 응답하라. 다른 텍스트나 마크다운 코드블록 없이 순수 JSON만 출력하라:
{
  "category": "CS|네트워크|데이터베이스|시스템설계|AI|협업",
  "question": "질문 내용 (1~2문장, 한국어)",
  "note": "이 질문을 고른 이유나 최근 트렌드와의 연관성 (1문장, 한국어)"
}`;

async function generateQuestion() {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: SYSTEM_PROMPT }],
          },
        ],
        tools: [{ google_search: {} }],
        generationConfig: {
          temperature: 0.9,
        },
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API 호출 실패 (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];
  if (!candidate) {
    throw new Error("Gemini 응답에 candidates가 없습니다: " + JSON.stringify(data));
  }

  const rawText = candidate.content?.parts?.map((p) => p.text || "").join("") || "";

  // 혹시 모델이 ```json ... ``` 로 감싸서 응답하는 경우 대비
  const cleaned = rawText.replace(/```json\s*|\s*```/g, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error("Gemini 응답을 JSON으로 파싱하지 못했습니다. 원문: " + rawText);
  }

  if (!parsed.category || !parsed.question) {
    throw new Error("필수 필드(category, question)가 누락되었습니다: " + JSON.stringify(parsed));
  }

  return parsed;
}

generateQuestion()
  .then((result) => {
    // 다음 스크립트가 파싱할 수 있도록 순수 JSON만 stdout에 출력
    console.log(JSON.stringify(result));
  })
  .catch((err) => {
    console.error("질문 생성 실패:", err.message);
    process.exit(1);
  });
