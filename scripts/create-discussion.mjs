// scripts/create-discussion.mjs
//
// generate-question.mjs의 JSON 출력을 인자로 받아
// GitHub GraphQL API로 저장소의 Discussion을 생성한다.
//

const TOKEN = process.env.DISCUSSION_PAT;
const REPO = process.env.GITHUB_REPOSITORY; // 예: "cs-hanjan/daily-cs-hanjan"
const CATEGORY_NAME = process.env.DISCUSSION_CATEGORY_NAME || "Daily Question";

if (!TOKEN) {
  console.error("DISCUSSION_PAT 환경변수가 설정되지 않았습니다.");
  process.exit(1);
}
if (!REPO) {
  console.error("GITHUB_REPOSITORY 환경변수가 설정되지 않았습니다.");
  process.exit(1);
}

const [OWNER, NAME] = REPO.split("/");

const inputJson = process.argv[2];
if (!inputJson) {
  console.error("사용법: node create-discussion.mjs '<질문 JSON 문자열>'");
  process.exit(1);
}

let questionData;
try {
  questionData = JSON.parse(inputJson);
} catch (e) {
  console.error("입력 JSON 파싱 실패:", e.message);
  process.exit(1);
}

async function graphql(query, variables) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();
  if (json.errors) {
    throw new Error("GraphQL 오류: " + JSON.stringify(json.errors));
  }
  return json.data;
}

async function getRepoAndCategoryIds() {
  const query = `
    query($owner: String!, $name: String!) {
      repository(owner: $owner, name: $name) {
        id
        discussionCategories(first: 25) {
          nodes {
            id
            name
          }
        }
      }
    }
  `;
  const data = await graphql(query, { owner: OWNER, name: NAME });
  const repo = data.repository;
  if (!repo) {
    throw new Error(`저장소를 찾을 수 없습니다: ${OWNER}/${NAME}`);
  }

  const category = repo.discussionCategories.nodes.find(
    (c) => c.name === CATEGORY_NAME
  );
  if (!category) {
    const available = repo.discussionCategories.nodes.map((c) => c.name).join(", ");
    throw new Error(
      `카테고리 "${CATEGORY_NAME}"를 찾을 수 없습니다. 사용 가능한 카테고리: ${available}`
    );
  }

  return { repositoryId: repo.id, categoryId: category.id };
}

function formatDate() {
  const now = new Date();
  // KST 기준 표시용
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

function buildTitle(category, question) {
  const date = formatDate();
  return `[${category}] ${date} 오늘의 질문`;
}

function buildBody({ category, question, note }) {
  return `## 🙋 오늘의 질문

**[${category}]** ${question}

---

💬 답변은 이 글의 댓글로 자유롭게 남겨주세요.
🐢 자정 넘어서 늦게 올려도 괜찮습니다.
🔖 오늘 참여가 어렵다면 이 글에 리액션만 남겨서 나중에 다시 보세요.

${note ? `> ${note}` : ""}
`;
}

async function createDiscussion() {
  const { repositoryId, categoryId } = await getRepoAndCategoryIds();

  const title = buildTitle(questionData.category, questionData.question);
  const body = buildBody(questionData);

  const mutation = `
    mutation($repositoryId: ID!, $categoryId: ID!, $title: String!, $body: String!) {
      createDiscussion(input: {
        repositoryId: $repositoryId,
        categoryId: $categoryId,
        title: $title,
        body: $body
      }) {
        discussion {
          url
        }
      }
    }
  `;

  const data = await graphql(mutation, {
    repositoryId,
    categoryId,
    title,
    body,
  });

  console.log("Discussion 생성 완료:", data.createDiscussion.discussion.url);
}

createDiscussion().catch((err) => {
  console.error("Discussion 생성 실패:", err.message);
  process.exit(1);
});
