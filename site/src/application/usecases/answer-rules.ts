import type { Answer } from "@/domain/entities/answer";
import { isAutoCloseComment } from "@/domain/policies/auto-close-policy";

// 답변으로 세는 대상: 마감 댓글이 아닌 최상위 댓글. 답글은 답변 카드 안에 따로 표시한다
export function isCountedAnswer(answer: Answer): boolean {
  return answer.parentId === null && !isAutoCloseComment(answer.body);
}
