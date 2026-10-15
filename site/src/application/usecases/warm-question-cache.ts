import type { CacheInvalidator } from "../ports/cache-invalidator";
import type { DiscussionSource, QuestionWithAnswers } from "../ports/discussion-source";
import type { Expectation } from "../ports/webhook-receiver";

export type WarmDeps = {
  readonly source: DiscussionSource;
  readonly invalidator: CacheInvalidator;
  readonly sleep?: (ms: number) => Promise<void>;
  readonly retryDelayMs?: number;
  readonly maxAttempts?: number;
};

export type WarmOutcome = "warmed" | "not-reflected";

const normalize = (text: string) => text.replace(/\r\n/g, "\n").trim();

export function satisfies(item: QuestionWithAnswers | null, expectation: Expectation | null): boolean {
  if (!expectation) return true;
  switch (expectation.type) {
    case "question-present":
      return item !== null;
    case "question-absent":
      return item === null;
    case "comment-present":
      return item?.answers.some((answer) => answer.id === expectation.commentId) ?? false;
    case "comment-absent":
      return !(item?.answers.some((answer) => answer.id === expectation.commentId) ?? false);
    case "comment-body": {
      const answer = item?.answers.find((candidate) => candidate.id === expectation.commentId);
      return answer !== undefined && normalize(answer.body) === normalize(expectation.body);
    }
  }
}

// 웹훅 직후 데이터를 미리 가져와 캐시를 채워 두면 다음 방문자가 GitHub 조회를 기다리지 않는다.
// 조회 결과가 방금 일어난 변경을 아직 담지 않았다면 옛 데이터가 캐시에 남지 않도록 비우고 다시 시도한다.
export async function warmQuestionCache(
  deps: WarmDeps,
  change: { readonly questionNumber: number; readonly expectation: Expectation | null },
): Promise<WarmOutcome> {
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const retryDelayMs = deps.retryDelayMs ?? 1500;
  const maxAttempts = deps.maxAttempts ?? 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const item = await deps.source.fetchOne(change.questionNumber);
    if (satisfies(item, change.expectation)) {
      await deps.source.fetchAll();
      return "warmed";
    }
    deps.invalidator.invalidateQuestion(change.questionNumber);
    if (attempt < maxAttempts) await sleep(retryDelayMs * attempt);
  }
  deps.invalidator.invalidateLists();
  return "not-reflected";
}
