import { describe, expect, it } from "vitest";
import { listCategories } from "@/application/usecases/list-categories";
import { listQuestionsByCategory } from "@/application/usecases/list-questions-by-category";
import { listRecentQuestions } from "@/application/usecases/list-recent-questions";
import { createSampleSource } from "../support/sample-source";

describe("listCategories", () => {
  it("카테고리별 질문 수를 세고 slug를 붙인다. 같은 수면 한국어 정렬(한글 먼저)", async () => {
    const categories = await listCategories(await createSampleSource());
    expect(categories).toEqual([
      { name: "네트워크", slug: "network", questionCount: 1 },
      { name: "AI", slug: "ai", questionCount: 1 },
      { name: "CS", slug: "cs", questionCount: 1 },
    ]);
  });

  it("카테고리별 질문 수의 합은 전체 질문 수와 같다 (FR-1)", async () => {
    const source = await createSampleSource();
    const total = (await listCategories(source)).reduce((sum, c) => sum + c.questionCount, 0);
    expect(total).toBe((await source.fetchAll()).length);
  });
});

describe("listQuestionsByCategory", () => {
  it("slug로 카테고리의 질문을 최신순으로 돌려준다", async () => {
    const result = await listQuestionsByCategory(await createSampleSource(), "network");
    expect(result?.category).toBe("네트워크");
    expect(result?.questions.map((q) => q.number)).toEqual([2]);
  });

  it("답변 수에서 마감 댓글을 뺀다", async () => {
    const result = await listQuestionsByCategory(await createSampleSource(), "network");
    expect(result?.questions[0]?.answerCount).toBe(3);
  });

  it("대댓글도 답변 수에 포함한다", async () => {
    const result = await listQuestionsByCategory(await createSampleSource(), "cs");
    expect(result?.questions[0]?.answerCount).toBe(2);
  });

  it("없는 slug는 null이다", async () => {
    expect(await listQuestionsByCategory(await createSampleSource(), "nope")).toBeNull();
  });
});

describe("listRecentQuestions", () => {
  it("전체 질문을 최신순으로 limit개만 돌려준다", async () => {
    const recent = await listRecentQuestions(await createSampleSource(), 2);
    expect(recent.map((q) => q.number)).toEqual([4, 3]);
  });
});
