import { describe, expect, it } from "vitest";
import type { QuestionWithAnswers } from "@/application/ports/discussion-source";
import { satisfies, warmQuestionCache } from "@/application/usecases/warm-question-cache";

const item = (answers: { id: string; body: string }[]): QuestionWithAnswers => ({
  question: { number: 34, title: "[CS] t", text: "t", note: null, category: "CS", createdAt: "2026-10-15T00:00:00Z", closed: false, url: "u", bodyHtml: "" },
  answers: answers.map((a) => ({ ...a, questionNumber: 34, author: "x", bodyHtml: "", bodyText: "", createdAt: "2026-10-15T00:00:00Z", parentId: null })),
});

function setup(oneResults: (QuestionWithAnswers | null)[]) {
  const calls: string[] = [];
  let i = 0;
  const source = {
    fetchOne: async (n: number) => { calls.push(`one-${n}`); return oneResults[Math.min(i++, oneResults.length - 1)] ?? null; },
    fetchAll: async () => { calls.push("all"); return []; },
  };
  const invalidator = { invalidateQuestion: (n: number) => calls.push(`inv-q-${n}`), invalidateLists: () => calls.push("inv-lists") };
  const sleeps: number[] = [];
  const deps = { source, invalidator, sleep: async (ms: number) => { sleeps.push(ms); }, retryDelayMs: 100 };
  return { calls, sleeps, deps };
}

describe("satisfies", () => {
  const data = item([{ id: "A", body: "원문\r\n둘째 줄 " }]);
  it("기준이 없으면 항상 만족한다", () => expect(satisfies(null, null)).toBe(true));
  it("댓글 존재와 부재", () => {
    expect(satisfies(data, { type: "comment-present", commentId: "A" })).toBe(true);
    expect(satisfies(data, { type: "comment-present", commentId: "B" })).toBe(false);
    expect(satisfies(data, { type: "comment-absent", commentId: "B" })).toBe(true);
    expect(satisfies(data, { type: "comment-absent", commentId: "A" })).toBe(false);
  });
  it("수정 본문은 줄바꿈과 앞뒤 공백 차이를 무시하고 비교한다", () => {
    expect(satisfies(data, { type: "comment-body", commentId: "A", body: "원문\n둘째 줄" })).toBe(true);
    expect(satisfies(data, { type: "comment-body", commentId: "A", body: "다른 내용" })).toBe(false);
  });
  it("질문 글 존재와 부재", () => {
    expect(satisfies(data, { type: "question-present" })).toBe(true);
    expect(satisfies(null, { type: "question-absent" })).toBe(true);
    expect(satisfies(null, { type: "question-present" })).toBe(false);
  });
});

describe("warmQuestionCache", () => {
  it("변경이 반영돼 있으면 질문과 목록을 한 번씩 조회해 캐시를 채운다", async () => {
    const { calls, deps } = setup([item([{ id: "A", body: "x" }])]);
    expect(await warmQuestionCache(deps, { questionNumber: 34, expectation: { type: "comment-present", commentId: "A" } })).toBe("warmed");
    expect(calls).toEqual(["one-34", "all"]);
  });

  it("확인 기준이 없어도 캐시를 채운다", async () => {
    const { calls, deps } = setup([item([])]);
    expect(await warmQuestionCache(deps, { questionNumber: 34, expectation: null })).toBe("warmed");
    expect(calls).toEqual(["one-34", "all"]);
  });

  it("아직 반영 전이면 낡은 항목을 비우고 기다렸다가 다시 조회한다", async () => {
    const { calls, sleeps, deps } = setup([item([]), item([{ id: "A", body: "x" }])]);
    expect(await warmQuestionCache(deps, { questionNumber: 34, expectation: { type: "comment-present", commentId: "A" } })).toBe("warmed");
    expect(calls).toEqual(["one-34", "inv-q-34", "one-34", "all"]);
    expect(sleeps).toEqual([100]);
  });

  it("끝내 반영되지 않으면 낡은 데이터를 남기지 않고 비운 채 끝낸다", async () => {
    const { calls, deps } = setup([item([])]);
    expect(await warmQuestionCache(deps, { questionNumber: 34, expectation: { type: "comment-present", commentId: "A" } })).toBe("not-reflected");
    expect(calls).toEqual(["one-34", "inv-q-34", "one-34", "inv-q-34", "one-34", "inv-q-34", "inv-lists"]);
    expect(calls).not.toContain("all");
  });

  it("삭제 기준은 댓글이 사라진 조회에서 통과한다", async () => {
    const { calls, deps } = setup([item([{ id: "A", body: "x" }]), item([])]);
    expect(await warmQuestionCache(deps, { questionNumber: 34, expectation: { type: "comment-absent", commentId: "A" } })).toBe("warmed");
    expect(calls).toEqual(["one-34", "inv-q-34", "one-34", "all"]);
  });
});
