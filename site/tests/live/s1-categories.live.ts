import { describe, expect, it } from "vitest";
import { GitHubGraphqlSource } from "@/adapters/source/github-graphql-source";
import { listCategories } from "@/application/usecases/list-categories";
import { listQuestionsByCategory } from "@/application/usecases/list-questions-by-category";
import { extractCategory } from "@/domain/policies/category-extractor";

const token = process.env.GITHUB_TOKEN;
const OWNER = "tech-interview-lab";
const REPO = "daily-cs-hanjan";

async function titlesFromGitHub(): Promise<string[]> {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "User-Agent": "cs-hanjan-verify" },
    body: JSON.stringify({
      query: `{ repository(owner: "${OWNER}", name: "${REPO}") { discussions(first: 100) { totalCount nodes { title } } } }`,
    }),
  });
  const json = (await res.json()) as any;
  const { totalCount, nodes } = json.data.repository.discussions;
  if (nodes.length !== totalCount) throw new Error("글이 100개를 넘었습니다. 대조 쿼리에 페이지 처리를 추가하세요.");
  return nodes.map((n: { title: string }) => n.title);
}

describe.skipIf(!token)("S1 카테고리별 질문 수 대조 (FR-1)", () => {
  it("유스케이스의 카테고리별 질문 수가 GitHub 제목 접두어 집계와 일치한다", async () => {
    const source = new GitHubGraphqlSource({ token: token!, owner: OWNER, repo: REPO });
    const expected = new Map<string, number>();
    for (const title of await titlesFromGitHub()) {
      const category = extractCategory(title);
      if (category) expected.set(category, (expected.get(category) ?? 0) + 1);
    }

    const categories = await listCategories(source);
    const actual = new Map(categories.map((c) => [c.name, c.questionCount]));
    console.log(JSON.stringify({ GitHub: Object.fromEntries(expected), 사이트: Object.fromEntries(actual) }));
    expect(actual).toEqual(expected);

    for (const category of categories) {
      const page = await listQuestionsByCategory(source, category.slug);
      expect(page?.questions.length).toBe(expected.get(category.name));
    }
  });
});
