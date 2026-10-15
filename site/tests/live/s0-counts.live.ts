import { describe, expect, it } from "vitest";
import { GitHubGraphqlSource } from "@/adapters/source/github-graphql-source";
import { isAutoCloseComment } from "@/domain/policies/auto-close-policy";
import { extractCategory } from "@/domain/policies/category-extractor";

const token = process.env.GITHUB_TOKEN;
const OWNER = "tech-interview-lab";
const REPO = "daily-cs-hanjan";

type Count = { number: number; title: string; closed: boolean; comments: { totalCount: number } };

async function fetchCounts(): Promise<Count[]> {
  const out: Count[] = [];
  let cursor: string | null = null;
  for (;;) {
    const res: Response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "User-Agent": "cs-hanjan-verify" },
      body: JSON.stringify({
        query: `query($cursor: String) { repository(owner: "${OWNER}", name: "${REPO}") {
          discussions(first: 100, after: $cursor) { pageInfo { hasNextPage endCursor }
            nodes { number title closed comments { totalCount } } } } }`,
        variables: { cursor },
      }),
    });
    const json = (await res.json()) as any;
    const page = json.data.repository.discussions;
    out.push(...page.nodes);
    if (!page.pageInfo.hasNextPage) return out;
    cursor = page.pageInfo.endCursor;
  }
}

describe.skipIf(!token)("S0 실제 GitHub 데이터 건수 대조", () => {
  it("어댑터 결과가 별도 조회(totalCount)와 일치하고 마감 댓글 제외 기준을 만족한다", async () => {
    const source = new GitHubGraphqlSource({ token: token!, owner: OWNER, repo: REPO });
    const items = await source.fetchAll();
    const counts = await fetchCounts();

    const questionCounts = counts.filter((c) => extractCategory(c.title));
    expect(items.map((i) => i.question.number).sort((a, b) => a - b)).toEqual(
      questionCounts.map((c) => c.number).sort((a, b) => a - b),
    );

    const topLevel = items.flatMap((i) => i.answers.filter((a) => a.parentId === null));
    const expectedTopLevel = questionCounts.reduce((sum, c) => sum + c.comments.totalCount, 0);
    expect(topLevel.length).toBe(expectedTopLevel);

    const all = items.flatMap((i) => i.answers);
    const excluded = all.filter((a) => isAutoCloseComment(a.body));
    const kept = all.filter((a) => !isAutoCloseComment(a.body));
    const maxPerQuestion = Math.max(...items.map((i) => i.answers.filter((a) => isAutoCloseComment(a.body)).length));
    const closedCount = items.filter((i) => i.question.closed).length;
    const byAuthor = new Map<string, number>();
    for (const a of kept) byAuthor.set(a.author ?? "(탈퇴)", (byAuthor.get(a.author ?? "(탈퇴)") ?? 0) + 1);
    const authorSum = [...byAuthor.values()].reduce((s, n) => s + n, 0);

    console.log(JSON.stringify({
      GitHub전체글: counts.length, 질문: items.length, 공지등제외: counts.length - items.length,
      전체답변: all.length, 최상위댓글: topLevel.length, 대댓글: all.length - topLevel.length,
      마감댓글제외: excluded.length, 닫힌질문: closedCount, 질문당최대제외: maxPerQuestion,
      반영답변: kept.length, 작성자별합: authorSum, 작성자별: Object.fromEntries(byAuthor),
    }, null, 1));

    expect(maxPerQuestion).toBeLessThanOrEqual(1);
    expect(excluded.length).toBeLessThanOrEqual(closedCount);
    expect(kept.length).toBe(all.length - excluded.length);
    expect(authorSum).toBe(kept.length);
  });
});
