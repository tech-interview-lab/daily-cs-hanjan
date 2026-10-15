// GitHub 조회가 방금 일어난 변경을 이미 반영했는지 확인할 때 쓰는 기대 상태
export type Expectation =
  | { readonly type: "comment-present"; readonly commentId: string }
  | { readonly type: "comment-absent"; readonly commentId: string }
  | { readonly type: "comment-body"; readonly commentId: string; readonly body: string }
  | { readonly type: "question-present" }
  | { readonly type: "question-absent" };

export type WebhookResult =
  | { readonly kind: "invalid-signature" }
  | { readonly kind: "ping" }
  | { readonly kind: "ignored"; readonly reason: string }
  | { readonly kind: "discussion-changed"; readonly questionNumber: number; readonly expectation: Expectation | null };

export interface WebhookReceiver {
  receive(body: string, signature: string | null, eventName: string | null): WebhookResult;
}
