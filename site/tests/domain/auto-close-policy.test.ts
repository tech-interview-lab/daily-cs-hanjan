import { describe, expect, it } from "vitest";
import { isAutoCloseComment } from "@/domain/policies/auto-close-policy";

describe("isAutoCloseComment", () => {
  it("숨은 표식이 있으면 마감 댓글이다", () => {
    expect(isAutoCloseComment("<!-- hanjan:auto-close -->\n🔒 마감")).toBe(true);
    expect(isAutoCloseComment("앞 문구\n<!-- hanjan:auto-close -->")).toBe(true);
  });

  it("n8n 시절 고정 문구(🔒)로 시작하면 마감 댓글이다", () => {
    expect(
      isAutoCloseComment("🔒 다음 질문이 올라와서 이 토론은 마감되었습니다.\n늦게라도 답변 남기고 싶으시면 편하게 댓글 달아주세요 🐢"),
    ).toBe(true);
  });

  it("GitHub Actions 시절 고정 문구(⏰)로 시작하면 마감 댓글이다", () => {
    expect(isAutoCloseComment("⏰ **다음 질문이 올라와 이 글은 마감되었습니다.**\n\n늦게라도 답변 올리고 싶으시면")).toBe(true);
  });

  it("일반 답변은 마감 댓글이 아니다", () => {
    expect(isAutoCloseComment("TCP는 연결 지향 프로토콜입니다.")).toBe(false);
    expect(isAutoCloseComment("")).toBe(false);
  });

  it("고정 문구가 본문 중간에 나오면 마감 댓글이 아니다", () => {
    expect(isAutoCloseComment("참고로 '🔒 다음 질문이 올라와서' 라는 문구는 마감 안내입니다.")).toBe(false);
  });
});
