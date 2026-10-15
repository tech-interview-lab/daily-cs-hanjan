import { createHmac, timingSafeEqual } from "node:crypto";
import type { Expectation, WebhookReceiver, WebhookResult } from "@/application/ports/webhook-receiver";

const DISCUSSION_EVENTS = new Set(["discussion", "discussion_comment"]);

export class GitHubWebhookReceiver implements WebhookReceiver {
  constructor(private readonly secret: string) {
    if (!secret) throw new Error("웹훅 비밀값이 비어 있습니다.");
  }

  receive(body: string, signature: string | null, eventName: string | null): WebhookResult {
    if (!this.isValid(body, signature)) return { kind: "invalid-signature" };
    if (eventName === "ping") return { kind: "ping" };
    if (!eventName || !DISCUSSION_EVENTS.has(eventName)) return { kind: "ignored", reason: `처리하지 않는 이벤트: ${eventName}` };

    const payload = parsePayload(body);
    const number = payload?.discussion?.number;
    if (!Number.isInteger(number)) return { kind: "ignored", reason: "discussion.number가 없습니다." };
    return {
      kind: "discussion-changed",
      questionNumber: number as number,
      expectation: toExpectation(eventName, payload),
    };
  }

  private isValid(body: string, signature: string | null): boolean {
    if (!signature?.startsWith("sha256=")) return false;
    const expected = Buffer.from(`sha256=${createHmac("sha256", this.secret).update(body, "utf8").digest("hex")}`);
    const actual = Buffer.from(signature);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }
}

type Payload = {
  action?: unknown;
  discussion?: { number?: unknown };
  comment?: { node_id?: unknown; body?: unknown };
};

function parsePayload(body: string): Payload | null {
  try {
    return JSON.parse(body) as Payload;
  } catch {
    return null;
  }
}

// 웹훅이 알려 준 변경이 GitHub 조회에도 이미 반영됐는지 판단할 기준. 알 수 없으면 null(확인 없이 진행)
function toExpectation(eventName: string, payload: Payload | null): Expectation | null {
  const action = payload?.action;
  if (eventName === "discussion") {
    if (action === "created") return { type: "question-present" };
    if (action === "deleted") return { type: "question-absent" };
    return null;
  }
  const commentId = payload?.comment?.node_id;
  if (typeof commentId !== "string" || !commentId) return null;
  if (action === "created") return { type: "comment-present", commentId };
  if (action === "deleted") return { type: "comment-absent", commentId };
  if (action === "edited" && typeof payload?.comment?.body === "string") {
    return { type: "comment-body", commentId, body: payload.comment.body };
  }
  return null;
}
