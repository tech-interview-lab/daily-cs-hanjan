import { describe, expect, it } from "vitest";
import { extractQuestionText } from "@/domain/policies/question-text";

describe("extractQuestionText", () => {
  it("본문의 **[카테고리]** 뒤 질문 문장을 구분선 전까지 추출한다", () => {
    const body = "## 🙋 오늘의 질문\n\n**[네트워크]** TCP와 UDP의 차이는?\n\n---\n\n💬 답변은 댓글로";
    expect(extractQuestionText(body)).toBe("TCP와 UDP의 차이는?");
  });

  it("Windows 줄바꿈(\\r\\n)도 처리한다", () => {
    expect(extractQuestionText("**[CS]** 질문입니다.\r\n\r\n---\r\n")).toBe("질문입니다.");
  });

  it("여러 줄 질문은 그대로 유지한다", () => {
    expect(extractQuestionText("**[AI]** 첫 줄\n둘째 줄\n\n---")).toBe("첫 줄\n둘째 줄");
  });

  it("형식이 다르면 null이다", () => {
    expect(extractQuestionText("# 📌 그라운드룰\n\n본문")).toBeNull();
    expect(extractQuestionText("**[CS]** 구분선 없음")).toBeNull();
  });
});
