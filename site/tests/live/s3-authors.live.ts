import { describe, expect, it } from "vitest";
import { GitHubGraphqlSource } from "@/adapters/source/github-graphql-source";
import { listAnswersByAuthor, listAuthors } from "@/application/usecases/list-authors";
import { isAutoCloseComment } from "@/domain/policies/auto-close-policy";
import { extractCategory } from "@/domain/policies/category-extractor";

const token = process.env.GITHUB_TOKEN;
const OWNER = "tech-interview-lab";
const REPO = "daily-cs-hanjan";

// 사이트 코드와 다른 경로(댓글 작성자만 가볍게 조회)로 작성자별 답변 수를 센다
async function authorCountsFromGitHub(): Promise<{ counts: Map<string, number>; deleted: number; total: number }> {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "User-Agent": "cs-hanjan-verify" },
    body: JSON.stringify({
      query: `{ repository(owner: "${OWNER}", name: "${REPO}") { discussions(first: 100) { totalCount nodes { title
        comments(first: 100) { totalCount nodes { body author { login } } } } } } }`,
    }),
  });
  const json = (await res.json()) as any;
  const counts = new Map<string, number>();
  let deleted = 0;
  let total = 0;
  for (const d of json.data.repository.discussions.nodes) {
    if (!extractCategory(d.title)) continue;
    if (d.comments.nodes.length !== d.comments.totalCount) throw new Error("댓글이 100개를 넘었습니다. 대조 쿼리에 페이지 처리를 추가하세요.");
    for (const c of d.comments.nodes) {
      if (isAutoCloseComment(c.body)) continue;
      total++;
      if (!c.author) deleted++;
      else counts.set(c.author.login, (counts.get(c.author.login) ?? 0) + 1);
    }
  }
  return { counts, deleted, total };
}

describe.skipIf(!token)("S3 작성자별 답변 수 대조 (FR-2)", () => {
  it("작성자별 답변 수가 별도 조회와 일치하고, 합 + 탈퇴 계정 수 = 전체 답변 수", async () => {
    const source = new GitHubGraphqlSource({ token: token!, owner: OWNER, repo: REPO });
    const authors = await listAuthors(source);
    const expected = await authorCountsFromGitHub();
    // 화면에는 수를 보이지 않지만, 작성자 페이지의 답변 수로 FR-2를 검증한다
    const actual = new Map<string, number>();
    for (const author of authors) actual.set(author.login, (await listAnswersByAuthor(source, author.login))!.answers.length);
    const sum = [...actual.values()].reduce((s, n) => s + n, 0);
    console.log(JSON.stringify({ 작성자별: Object.fromEntries(actual), 합: sum, 탈퇴계정: expected.deleted, 전체답변: expected.total }));
    expect(actual).toEqual(expected.counts);
    expect(sum + expected.deleted).toBe(expected.total);
    expect(authors.every((a) => a.avatarUrl === null || a.avatarUrl.startsWith("https://avatars.githubusercontent.com/"))).toBe(true);
  });
});
