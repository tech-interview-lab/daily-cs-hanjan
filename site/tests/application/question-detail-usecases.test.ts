import { describe, expect, it } from "vitest";
import type { CacheInvalidator } from "@/application/ports/cache-invalidator";
import type { WebhookReceiver, WebhookResult } from "@/application/ports/webhook-receiver";
import { getQuestionDetail, listQuestionNumbers } from "@/application/usecases/get-question-detail";
import { handleDiscussionEvent } from "@/application/usecases/handle-discussion-event";
import { createSampleSource } from "../support/sample-source";

describe("getQuestionDetail", () => {
  it("마감 댓글을 빼고 답변을 작성 시각 순으로 돌려준다", async () => {
    const detail = await getQuestionDetail(await createSampleSource(), 2);
    expect(detail?.threads.map((t) => t.answer.id)).toEqual(["C_2_1", "C_2_2", "C_2_3"]);
  });

  it("답글을 부모 답변 아래로 묶는다", async () => {
    const detail = await getQuestionDetail(await createSampleSource(), 4);
    expect(detail?.threads).toHaveLength(1);
    expect(detail?.threads[0]?.replies.map((r) => r.id)).toEqual(["R_4_1_1"]);
  });

  it("질문 문장과 출제 의도를 담는다", async () => {
    const detail = await getQuestionDetail(await createSampleSource(), 2);
    expect(detail?.text).toBe("TCP와 UDP의 차이는?");
    expect(detail?.note).toBe("전송 계층 프로토콜의 신뢰성과 속도 차이를 묻습니다.");
    expect(detail?.categorySlug).toBe("network");
  });

  it("작성자가 없는 답변도 유지한다", async () => {
    const detail = await getQuestionDetail(await createSampleSource(), 2);
    expect(detail?.threads[1]?.answer.author).toBeNull();
  });

  it("답변이 없는 질문은 빈 목록이고 없는 번호는 null이다", async () => {
    const source = await createSampleSource();
    expect((await getQuestionDetail(source, 3))?.threads).toEqual([]);
    expect(await getQuestionDetail(source, 99999)).toBeNull();
  });

  it("질문 번호 목록을 돌려준다", async () => {
    expect(await listQuestionNumbers(await createSampleSource())).toEqual([2, 3, 4]);
  });
});

describe("handleDiscussionEvent", () => {
  function setup(result: WebhookResult) {
    const calls: string[] = [];
    const receiver: WebhookReceiver = { receive: () => result };
    const invalidator: CacheInvalidator = {
      invalidateQuestion: (n) => calls.push(`q-${n}`),
      invalidateLists: () => calls.push("lists"),
    };
    return { calls, run: () => handleDiscussionEvent({ receiver, invalidator }, { body: "{}", signature: "s", eventName: "e" }) };
  }

  it("질문이 바뀌면 그 질문과 목록만 무효화한다", () => {
    const { calls, run } = setup({ kind: "discussion-changed", questionNumber: 34, expectation: null });
    expect(run().kind).toBe("discussion-changed");
    expect(calls).toEqual(["q-34", "lists"]);
  });

  it("서명이 틀리거나 무시할 이벤트면 아무것도 무효화하지 않는다", () => {
    for (const result of [{ kind: "invalid-signature" }, { kind: "ping" }, { kind: "ignored", reason: "x" }] as WebhookResult[]) {
      const { calls, run } = setup(result);
      run();
      expect(calls).toEqual([]);
    }
  });
});
