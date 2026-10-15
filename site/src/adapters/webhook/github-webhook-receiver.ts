import { createHmac, timingSafeEqual } from "node:crypto";
import type { WebhookReceiver, WebhookResult } from "@/application/ports/webhook-receiver";

const DISCUSSION_EVENTS = new Set(["discussion", "discussion_comment"]);

export class GitHubWebhookReceiver implements WebhookReceiver {
  constructor(private readonly secret: string) {
    if (!secret) throw new Error("웹훅 비밀값이 비어 있습니다.");
  }

  receive(body: string, signature: string | null, eventName: string | null): WebhookResult {
    if (!this.isValid(body, signature)) return { kind: "invalid-signature" };
    if (eventName === "ping") return { kind: "ping" };
    if (!eventName || !DISCUSSION_EVENTS.has(eventName)) return { kind: "ignored", reason: `처리하지 않는 이벤트: ${eventName}` };

    const number = parseDiscussionNumber(body);
    if (number === null) return { kind: "ignored", reason: "discussion.number가 없습니다." };
    return { kind: "discussion-changed", questionNumber: number };
  }

  private isValid(body: string, signature: string | null): boolean {
    if (!signature?.startsWith("sha256=")) return false;
    const expected = Buffer.from(`sha256=${createHmac("sha256", this.secret).update(body, "utf8").digest("hex")}`);
    const actual = Buffer.from(signature);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }
}

function parseDiscussionNumber(body: string): number | null {
  try {
    const number = (JSON.parse(body) as { discussion?: { number?: unknown } }).discussion?.number;
    return Number.isInteger(number) ? (number as number) : null;
  } catch {
    return null;
  }
}
