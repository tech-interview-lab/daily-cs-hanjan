import { describe, expect, it } from "vitest";
import { announceNew, mergeNewThreads } from "@/presentation/presenters/merge-threads";
import type { AnswerVM, ThreadVM } from "@/presentation/viewmodels";

const a = (id: string, extra: Partial<AnswerVM> = {}): AnswerVM => ({
  id, authorLabel: id, authorDeleted: false, dateText: "", dateTime: "", bodyHtml: `<p>${id}</p>`, ...extra,
});
const t = (answer: AnswerVM, replies: AnswerVM[] = []): ThreadVM => ({ answer, replies });

describe("mergeNewThreads", () => {
  it("새 답변을 끝에 붙이고 새 답변으로 표시한다", () => {
    const result = mergeNewThreads([t(a("1"))], [t(a("1")), t(a("2"))]);
    expect(result.threads.map((x) => [x.answer.id, x.answer.isNew ?? false])).toEqual([["1", false], ["2", true]]);
    expect([result.newAnswers, result.newReplies]).toEqual([1, 0]);
  });

  it("기존 답변에 새 답글이 달리면 그 카드 안에 붙인다", () => {
    const result = mergeNewThreads([t(a("1"))], [t(a("1"), [a("r1")])]);
    expect(result.threads[0]?.replies.map((r) => [r.id, r.isNew])).toEqual([["r1", true]]);
    expect([result.newAnswers, result.newReplies]).toEqual([0, 1]);
  });

  it("수정과 삭제는 무시하고 기존 화면을 유지한다", () => {
    const current = [t(a("1", { bodyHtml: "<p>원래</p>" })), t(a("2"))];
    const result = mergeNewThreads(current, [t(a("1", { bodyHtml: "<p>수정</p>" }))]);
    expect(result.threads.map((x) => x.answer.bodyHtml)).toEqual(["<p>원래</p>", "<p>2</p>"]);
    expect([result.newAnswers, result.newReplies]).toEqual([0, 0]);
  });

  it("새 항목이 다시 들어오면 이전 '새 답변' 표시는 지운다", () => {
    const first = mergeNewThreads([t(a("1"))], [t(a("1")), t(a("2"))]).threads;
    const second = mergeNewThreads(first, [t(a("1")), t(a("2")), t(a("3"))]).threads;
    expect(second.map((x) => [x.answer.id, x.answer.isNew ?? false])).toEqual([["1", false], ["2", false], ["3", true]]);
  });

  it("새 항목이 없으면 표시를 그대로 둔다", () => {
    const first = mergeNewThreads([t(a("1"))], [t(a("1")), t(a("2"))]).threads;
    const same = mergeNewThreads(first, [t(a("1")), t(a("2"))]);
    expect(same.threads[1]?.answer.isNew).toBe(true);
  });
});

describe("announceNew", () => {
  it("추가된 답변과 답글 수를 알린다", () => {
    expect(announceNew(2, 0)).toBe("새 답변 2건이 추가되었습니다.");
    expect(announceNew(1, 1)).toBe("새 답변 1건, 새 답글 1건이 추가되었습니다.");
  });
});
