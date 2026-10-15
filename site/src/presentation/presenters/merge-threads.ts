import type { AnswerVM, ThreadVM } from "../viewmodels";

export type MergeResult = {
  readonly threads: ThreadVM[];
  readonly newAnswers: number;
  readonly newReplies: number;
  readonly edited: number;
  readonly removed: number;
};

const NO_CHANGE = { newAnswers: 0, newReplies: 0, edited: 0, removed: 0 };

// 폴링으로 받은 최신 상태를 현재 화면에 합친다. 새 답변과 답글은 끝에 붙이고, 수정된 항목은 본문을 바꿔 '수정됨'으로 표시하고,
// 삭제된 항목은 제거한다. 읽던 위치가 갑자기 움직이지 않도록 기존 항목의 순서는 유지한다(site-design.md 5.3).
export function mergeNewThreads(current: readonly ThreadVM[], latest: readonly ThreadVM[]): MergeResult {
  const latestById = new Map(latest.map((thread) => [thread.answer.id, thread]));
  const clear = (a: AnswerVM): AnswerVM => (a.isNew || a.isEdited ? { ...a, isNew: false, isEdited: false } : a);
  const counts = { newAnswers: 0, newReplies: 0, edited: 0, removed: 0 };

  // 수정된 항목은 최신 내용으로 바꾸고 표시를 붙인다
  const refresh = (known: AnswerVM, fresh: AnswerVM): AnswerVM => {
    if (known.bodyHtml === fresh.bodyHtml) return clear(known);
    counts.edited++;
    return { ...fresh, isNew: false, isEdited: true };
  };

  const kept: ThreadVM[] = [];
  for (const thread of current) {
    const fresh = latestById.get(thread.answer.id);
    if (!fresh) {
      counts.removed += 1 + thread.replies.length;
      continue;
    }
    const freshReplies = new Map(fresh.replies.map((reply) => [reply.id, reply]));
    const replies: AnswerVM[] = [];
    for (const reply of thread.replies) {
      const freshReply = freshReplies.get(reply.id);
      if (!freshReply) counts.removed++;
      else replies.push(refresh(reply, freshReply));
    }
    const knownReplies = new Set(thread.replies.map((reply) => reply.id));
    for (const reply of fresh.replies) {
      if (knownReplies.has(reply.id)) continue;
      counts.newReplies++;
      replies.push({ ...reply, isNew: true, isEdited: false });
    }
    kept.push({ answer: refresh(thread.answer, fresh.answer), replies });
  }

  const knownThreads = new Set(current.map((thread) => thread.answer.id));
  for (const thread of latest) {
    if (knownThreads.has(thread.answer.id)) continue;
    counts.newAnswers++;
    kept.push({
      answer: { ...thread.answer, isNew: true, isEdited: false },
      replies: thread.replies.map((reply) => ({ ...reply, isNew: true, isEdited: false })),
    });
  }

  const changed = counts.newAnswers + counts.newReplies + counts.edited + counts.removed > 0;
  if (!changed) return { threads: [...current], ...NO_CHANGE };
  return { threads: kept, ...counts };
}

export function announceNew(result: Pick<MergeResult, "newAnswers" | "newReplies" | "edited" | "removed">): string {
  const parts: string[] = [];
  if (result.newAnswers) parts.push(`새 답변 ${result.newAnswers}건`);
  if (result.newReplies) parts.push(`새 답글 ${result.newReplies}건`);
  if (result.edited) parts.push(`수정 ${result.edited}건`);
  if (result.removed) parts.push(`삭제 ${result.removed}건`);
  return `${parts.join(", ")}이 반영되었습니다.`;
}
