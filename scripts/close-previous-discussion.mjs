// scripts/close-previous-discussion.mjs
//
// 새 질문을 올리기 직전에 실행되어, "가장 최근에 열려있던(Open)"
// Daily Question 카테고리의 Discussion을 찾아 Close 처리한다.
//

const TOKEN = process.env.DISCUSSION_PAT;
const REPO = process.env.GITHUB_REPOSITORY; // "owner/repo"
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

// 가장 최근에 만들어진, 아직 열려있는(open) Daily Question Discussion을 찾는다.
async function findLatestOpenDiscussion() {
  const query = `
    query($owner: String!, $name: String!) {
      repository(owner: $owner, name: $name) {
        discussions(first: 10, orderBy: {field: CREATED_AT, direction: DESC}) {
          nodes {
            id
            number
            title
            closed
            category { name }
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

  // Daily Question 카테고리 + 아직 열려있는 것 중 가장 최근 것
  const match = repo.discussions.nodes.find(
    (d) => d.category.name === CATEGORY_NAME && !d.closed
  );

  return match || null; // 없으면 null (오늘이 첫 질문인 경우)
}

async function closeDiscussion(discussionId) {
  const mutation = `
    mutation($discussionId: ID!) {
      closeDiscussion(input: { discussionId: $discussionId, reason: RESOLVED }) {
        discussion { url }
      }
    }
  `;
  const data = await graphql(mutation, { discussionId });
  return data.closeDiscussion.discussion.url;
}

async function addClosingNotice(discussionId) {
  const body = `⏰ **다음 질문이 올라와 이 글은 마감되었습니다.**

늦게라도 답변 올리고 싶으시면 언제든 편하게 🐢 이모지와 함께 댓글 남겨주세요. 댓글은 계속 가능합니다!`;

  const mutation = `
    mutation($discussionId: ID!, $body: String!) {
      addDiscussionComment(input: { discussionId: $discussionId, body: $body }) {
        comment { url }
      }
    }
  `;
  await graphql(mutation, { discussionId, body });
}

async function main() {
  const target = await findLatestOpenDiscussion();

  if (!target) {
    console.log("닫을 이전 Discussion이 없습니다 (오늘이 첫 질문이거나 이미 모두 닫혀있음).");
    return;
  }

  console.error(`닫을 대상: #${target.number} ${target.title}`);

  await addClosingNotice(target.id);
  const url = await closeDiscussion(target.id);

  console.log("이전 Discussion 마감 완료:", url);
}

main().catch((err) => {
  console.error("이전 Discussion 마감 실패:", err.message);
  process.exit(1);
});
