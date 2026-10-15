export type WebhookResult =
  | { readonly kind: "invalid-signature" }
  | { readonly kind: "ping" }
  | { readonly kind: "ignored"; readonly reason: string }
  | { readonly kind: "discussion-changed"; readonly questionNumber: number };

export interface WebhookReceiver {
  receive(body: string, signature: string | null, eventName: string | null): WebhookResult;
}
