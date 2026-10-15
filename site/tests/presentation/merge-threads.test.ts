import { describe, expect, it } from "vitest";
import { announceNew, mergeNewThreads } from "@/presentation/presenters/merge-threads";
import type { AnswerVM, ThreadVM } from "@/presentation/viewmodels";

const a = (id: string, extra: Partial<AnswerVM> = {}): AnswerVM => ({
  id, authorLabel: id, authorDeleted: false, authorHref: null, authorAvatarUrl: null, dateText: "", dateTime: "", bodyHtml: `<p>${id}</p>`, ...extra,
});
const t = (answer: AnswerVM, replies: AnswerVM[] = []): ThreadVM => ({ answer, replies });
const counts = (r: ReturnType<typeof mergeNewThreads>) => [r.newAnswers, r.newReplies, r.edited, r.removed];
const marks = (r: ReturnType<typeof mergeNewThreads>) => r.threads.map((x) => [x.answer.id, x.answer.isNew ?? false, x.answer.isEdited ?? false]);

describe("mergeNewThreads: 추가", () => {
  it("새 답변을 끝에 붙이고 새 답변으로 표시한다", () => {
    const result = mergeNewThreads([t(a("1"))], [t(a("1")), t(a("2"))]);
    expect(marks(result)).toEqual([["1", false, false], ["2", true, false]]);
    expect(counts(result)).toEqual([1, 0, 0, 0]);
  });

  it("기존 답변에 새 답글이 달리면 그 카드 안에 붙인다", () => {
    const result = mergeNewThreads([t(a("1"))], [t(a("1"), [a("r1")])]);
    expect(result.threads[0]?.replies.map((r) => [r.id, r.isNew])).toEqual([["r1", true]]);
    expect(counts(result)).toEqual([0, 1, 0, 0]);
  });

  it("새 변경이 들어오면 이전 표시는 지운다", () => {
    const first = mergeNewThreads([t(a("1"))], [t(a("1")), t(a("2"))]).threads;
    const second = mergeNewThreads(first, [t(a("1")), t(a("2")), t(a("3"))]);
    expect(marks(second)).toEqual([["1", false, false], ["2", false, false], ["3", true, false]]);
  });

  it("변경이 없으면 표시를 그대로 둔다", () => {
    const first = mergeNewThreads([t(a("1"))], [t(a("1")), t(a("2"))]).threads;
    const same = mergeNewThreads(first, [t(a("1")), t(a("2"))]);
    expect(same.threads[1]?.answer.isNew).toBe(true);
    expect(counts(same)).toEqual([0, 0, 0, 0]);
  });
});

describe("mergeNewThreads: 수정", () => {
  it("본문이 바뀐 답변은 최신 내용으로 바꾸고 수정됨으로 표시한다", () => {
    const result = mergeNewThreads([t(a("1")), t(a("2"))], [t(a("1", { bodyHtml: "<p>수정본</p>" })), t(a("2"))]);
    expect(result.threads[0]?.answer.bodyHtml).toBe("<p>수정본</p>");
    expect(marks(result)).toEqual([["1", false, true], ["2", false, false]]);
    expect(counts(result)).toEqual([0, 0, 1, 0]);
  });

  it("답글이 수정돼도 같은 방식으로 처리한다", () => {
    const result = mergeNewThreads([t(a("1"), [a("r1")])], [t(a("1"), [a("r1", { bodyHtml: "<p>고침</p>" })])]);
    expect(result.threads[0]?.replies[0]).toMatchObject({ bodyHtml: "<p>고침</p>", isEdited: true });
    expect(counts(result)).toEqual([0, 0, 1, 0]);
  });

  it("수정 표시는 다음 변경 때 지운다", () => {
    const first = mergeNewThreads([t(a("1"))], [t(a("1", { bodyHtml: "<p>v2</p>" }))]).threads;
    const second = mergeNewThreads(first, [t(a("1", { bodyHtml: "<p>v2</p>" })), t(a("2"))]);
    expect(marks(second)).toEqual([["1", false, false], ["2", true, false]]);
  });

  it("수정된 항목도 카드의 위치(순서)는 바뀌지 않는다", () => {
    const result = mergeNewThreads([t(a("1")), t(a("2")), t(a("3"))], [t(a("3")), t(a("2", { bodyHtml: "<p>x</p>" })), t(a("1"))]);
    expect(result.threads.map((x) => x.answer.id)).toEqual(["1", "2", "3"]);
  });
});

describe("mergeNewThreads: 삭제", () => {
  it("삭제된 답변은 제거한다", () => {
    const result = mergeNewThreads([t(a("1")), t(a("2")), t(a("3"))], [t(a("1")), t(a("3"))]);
    expect(result.threads.map((x) => x.answer.id)).toEqual(["1", "3"]);
    expect(counts(result)).toEqual([0, 0, 0, 1]);
  });

  it("삭제된 답변에 달린 답글도 함께 센다", () => {
    const result = mergeNewThreads([t(a("1"), [a("r1"), a("r2")])], []);
    expect(result.threads).toEqual([]);
    expect(counts(result)).toEqual([0, 0, 0, 3]);
  });

  it("답글만 삭제되면 그 답글만 제거한다", () => {
    const result = mergeNewThreads([t(a("1"), [a("r1"), a("r2")])], [t(a("1"), [a("r2")])]);
    expect(result.threads[0]?.replies.map((r) => r.id)).toEqual(["r2"]);
    expect(counts(result)).toEqual([0, 0, 0, 1]);
  });

  it("추가, 수정, 삭제가 한꺼번에 와도 각각 센다", () => {
    const result = mergeNewThreads(
      [t(a("1")), t(a("2")), t(a("3"))],
      [t(a("1", { bodyHtml: "<p>고침</p>" })), t(a("3")), t(a("4"))],
    );
    expect(result.threads.map((x) => x.answer.id)).toEqual(["1", "3", "4"]);
    expect(counts(result)).toEqual([1, 0, 1, 1]);
  });
});

describe("announceNew", () => {
  it("반영된 변경의 종류와 수를 알린다", () => {
    expect(announceNew({ newAnswers: 2, newReplies: 0, edited: 0, removed: 0 })).toBe("새 답변 2건이 반영되었습니다.");
    expect(announceNew({ newAnswers: 1, newReplies: 1, edited: 0, removed: 0 })).toBe("새 답변 1건, 새 답글 1건이 반영되었습니다.");
    expect(announceNew({ newAnswers: 0, newReplies: 0, edited: 1, removed: 2 })).toBe("수정 1건, 삭제 2건이 반영되었습니다.");
  });
});
