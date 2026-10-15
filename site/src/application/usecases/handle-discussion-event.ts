import type { CacheInvalidator } from "../ports/cache-invalidator";
import type { WebhookReceiver, WebhookResult } from "../ports/webhook-receiver";

export type HandleDiscussionEventInput = {
  readonly body: string;
  readonly signature: string | null;
  readonly eventName: string | null;
};

export function handleDiscussionEvent(
  deps: { readonly receiver: WebhookReceiver; readonly invalidator: CacheInvalidator },
  input: HandleDiscussionEventInput,
): WebhookResult {
  const result = deps.receiver.receive(input.body, input.signature, input.eventName);
  if (result.kind === "discussion-changed") {
    deps.invalidator.invalidateQuestion(result.questionNumber);
    deps.invalidator.invalidateLists();
  }
  return result;
}
