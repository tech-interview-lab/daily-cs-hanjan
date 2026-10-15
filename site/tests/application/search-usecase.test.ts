import { describe, expect, it } from "vitest";
import { SubstringSearch } from "@/adapters/search/substring-search";
import { MAX_QUERY_LENGTH, searchQuestions } from "@/application/usecases/search-questions";
import { createSampleSource } from "../support/sample-source";

const run = async (q: string) => searchQuestions({ source: await createSampleSource(), index: new SubstringSearch() }, q);

describe("searchQuestions (FR-3)", () => {
  it("질문 문장의 키워드로 찾는다", async () => {
    const { results } = await run("UDP의 차이");
    expect(results.map((r) => r.question.number)).toEqual([2]);
    expect(results[0]?.hits[0]?.document.field).toBe("question");
  });

  it("답변 본문의 키워드로 찾는다", async () => {
    const { results } = await run("순서대로");
    expect(results.map((r) => r.question.number)).toEqual([4]);
    expect(results[0]?.hits[0]?.document).toMatchObject({ field: "answer", author: "rn1217" });
  });

  it("마감 댓글과 답글은 검색하지 않는다", async () => {
    expect((await run("마감되었습니다")).results).toEqual([]);
    expect((await run("비동기는요")).results).toEqual([]);
  });

  it("질문 문장에서 일치한 질문을 답변에서만 일치한 질문보다 앞에 둔다", async () => {
    const { results } = await run("차이");
    expect(results[0]?.hits[0]?.document.field).toBe("question");
  });

  it("빈 검색어는 결과 없이 돌려주고, 너무 긴 검색어는 자른다", async () => {
    expect(await run("   ")).toEqual({ query: "", results: [] });
    expect((await run("가".repeat(MAX_QUERY_LENGTH + 50))).query).toHaveLength(MAX_QUERY_LENGTH);
  });
});
