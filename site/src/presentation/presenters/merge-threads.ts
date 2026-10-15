import type { AnswerVM, ThreadVM } from "../viewmodels";

export type MergeResult = { readonly threads: ThreadVM[]; readonly newAnswers: number; readonly newReplies: number };

// 새로 생긴 답변과 답글만 덧붙인다. 수정과 삭제는 새로고침 때 반영(site-design.md 5.3)
export function mergeNewThreads(current: readonly ThreadVM[], latest: readonly ThreadVM[]): MergeResult {
  const unmark = (a: AnswerVM): AnswerVM => (a.isNew ? { ...a, isNew: false } : a);
  const byId = new Map(latest.map((thread) => [thread.answer.id, thread]));
  let newReplies = 0;

  const threads: ThreadVM[] = current.map((thread) => {
    const known = new Set(thread.replies.map((reply) => reply.id));
    const added = (byId.get(thread.answer.id)?.replies ?? []).filter((reply) => !known.has(reply.id));
    newReplies += added.length;
    return {
      answer: unmark(thread.answer),
      replies: [...thread.replies.map(unmark), ...added.map((reply) => ({ ...reply, isNew: true }))],
    };
  });

  const knownThreads = new Set(current.map((thread) => thread.answer.id));
  const addedThreads = latest.filter((thread) => !knownThreads.has(thread.answer.id));
  threads.push(...addedThreads.map((thread) => ({
    answer: { ...thread.answer, isNew: true },
    replies: thread.replies.map((reply) => ({ ...reply, isNew: true })),
  })));

  if (addedThreads.length === 0 && newReplies === 0) return { threads: [...current], newAnswers: 0, newReplies: 0 };
  return { threads, newAnswers: addedThreads.length, newReplies };
}

export function announceNew(newAnswers: number, newReplies: number): string {
  const parts = [];
  if (newAnswers) parts.push(`새 답변 ${newAnswers}건`);
  if (newReplies) parts.push(`새 답글 ${newReplies}건`);
  return `${parts.join(", ")}이 추가되었습니다.`;
}
