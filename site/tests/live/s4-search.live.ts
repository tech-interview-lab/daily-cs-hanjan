import { describe, expect, it } from "vitest";
import { SubstringSearch } from "@/adapters/search/substring-search";
import { GitHubGraphqlSource } from "@/adapters/source/github-graphql-source";
import { searchQuestions } from "@/application/usecases/search-questions";
import { isAutoCloseComment } from "@/domain/policies/auto-close-policy";

const token = process.env.GITHUB_TOKEN;

describe.skipIf(!token)("S4 검색 (FR-3)", () => {
  it("질문 제목 키워드와 답변 본문 키워드로 각각 해당 질문이 검색된다", async () => {
    const source = new GitHubGraphqlSource({ token: token!, owner: "tech-interview-lab", repo: "daily-cs-hanjan" });
    const deps = { source, index: new SubstringSearch() };
    const items = await source.fetchAll();

    // 실제 데이터에서 검색어를 고른다: 한 질문 문장에만 있는 단어, 답변에만 있고 질문 문장에는 없는 단어
    const titleTarget = items.find((i) => i.question.text.includes("멱등성"))!;
    const answerOnly = items
      .flatMap((i) => i.answers.filter((a) => a.parentId === null && !isAutoCloseComment(a.body)).map((a) => ({ i, a })))
      .find(({ i, a }) => a.bodyText.includes("커넥션 풀") && !i.question.text.includes("커넥션 풀"))!;

    const byTitle = await searchQuestions(deps, "멱등성");
    const byBody = await searchQuestions(deps, "커넥션 풀");
    console.log(JSON.stringify({
      제목검색: { 검색어: "멱등성", 기대: titleTarget.question.number, 결과: byTitle.results.map((r) => r.question.number) },
      본문검색: { 검색어: "커넥션 풀", 기대: answerOnly.i.question.number, 결과: byBody.results.map((r) => r.question.number) },
    }));
    expect(byTitle.results.map((r) => r.question.number)).toContain(titleTarget.question.number);
    expect(byTitle.results[0]?.hits[0]?.document.field).toBe("question");
    expect(byBody.results.map((r) => r.question.number)).toContain(answerOnly.i.question.number);
  });
});
