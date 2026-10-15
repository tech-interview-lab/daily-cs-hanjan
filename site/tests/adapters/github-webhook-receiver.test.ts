import { describe, expect, it } from "vitest";
import { GitHubWebhookReceiver } from "@/adapters/webhook/github-webhook-receiver";
import { sign } from "../support/sign";

const SECRET = "test-secret";
const receiver = new GitHubWebhookReceiver(SECRET);
const commentEvent = JSON.stringify({ action: "created", discussion: { number: 34 }, comment: { body: "답변" } });

describe("GitHubWebhookReceiver", () => {
  it("올바른 서명의 댓글 이벤트에서 질문 번호를 꺼낸다", () => {
    expect(receiver.receive(commentEvent, sign(SECRET, commentEvent), "discussion_comment")).toEqual({
      kind: "discussion-changed", questionNumber: 34,
    });
  });

  it("글 이벤트(생성, 마감, 수정, 삭제)도 같은 방식으로 처리한다", () => {
    const body = JSON.stringify({ action: "closed", discussion: { number: 33 } });
    expect(receiver.receive(body, sign(SECRET, body), "discussion")).toEqual({ kind: "discussion-changed", questionNumber: 33 });
  });

  it("서명이 없거나 틀리면 거부한다", () => {
    expect(receiver.receive(commentEvent, null, "discussion_comment").kind).toBe("invalid-signature");
    expect(receiver.receive(commentEvent, sign("wrong", commentEvent), "discussion_comment").kind).toBe("invalid-signature");
    expect(receiver.receive(commentEvent, "sha256=abc", "discussion_comment").kind).toBe("invalid-signature");
  });

  it("본문이 한 글자라도 바뀌면 거부한다", () => {
    const signature = sign(SECRET, commentEvent);
    expect(receiver.receive(commentEvent.replace("34", "35"), signature, "discussion_comment").kind).toBe("invalid-signature");
  });

  it("서명이 틀리면 이벤트 종류와 상관없이 먼저 거부한다", () => {
    expect(receiver.receive("{}", "sha256=00", "ping").kind).toBe("invalid-signature");
  });

  it("ping은 따로 알리고 다른 이벤트는 무시한다", () => {
    const body = JSON.stringify({ zen: "hi" });
    expect(receiver.receive(body, sign(SECRET, body), "ping").kind).toBe("ping");
    expect(receiver.receive(body, sign(SECRET, body), "push").kind).toBe("ignored");
  });

  it("질문 번호가 없거나 JSON이 아니면 무시한다", () => {
    for (const body of ["{}", "not json", JSON.stringify({ discussion: { number: "34" } })]) {
      expect(receiver.receive(body, sign(SECRET, body), "discussion").kind).toBe("ignored");
    }
  });

  it("비밀값이 비어 있으면 만들 수 없다", () => {
    expect(() => new GitHubWebhookReceiver("")).toThrow();
  });
});
