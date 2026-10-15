import { describe, expect, it } from "vitest";
import { formatKstDate, formatKstDateTime, presentNavItems, presentQuestionItem, presentThreads } from "@/presentation/presenters";

describe("presenters", () => {
  it("날짜를 한국 시간 기준 YYYY-MM-DD로 표시한다", () => {
    expect(formatKstDate("2026-10-14T00:05:42Z")).toBe("2026-10-14");
    expect(formatKstDate("2026-10-14T15:30:00Z")).toBe("2026-10-15");
  });

  it("카테고리 링크와 질문 수 라벨을 만든다", () => {
    const items = presentNavItems(
      [
        { name: "네트워크", slug: "network", questionCount: 6 },
        { name: "AI", slug: "ai", questionCount: 2 },
      ],
    );
    expect(items.map((i) => [i.href, i.countLabel])).toEqual([
      ["/category/network", "질문 6개"],
      ["/category/ai", "질문 2개"],
    ]);
  });

  it("질문 항목에 마감 여부를 텍스트 라벨로 담는다", () => {
    const base = {
      number: 1, text: "질문", category: "CS", categorySlug: "cs",
      createdAt: "2026-10-01T00:05:00Z", url: "https://github.com/o/r/discussions/1", answerCount: 3,
    };
    expect(presentQuestionItem({ ...base, closed: true }).statusLabel).toBe("마감");
    expect(presentQuestionItem({ ...base, closed: false }).statusLabel).toBe("진행 중");
    expect(presentQuestionItem({ ...base, closed: true }).answerCountText).toBe("답변 3");
  });

  it("질문 항목은 사이트의 질문 상세로 연결한다", () => {
    const item = presentQuestionItem({
      number: 34, text: "질문", category: "CS", categorySlug: "cs", closed: false,
      createdAt: "2026-10-15T00:05:00Z", url: "https://github.com/o/r/discussions/34", answerCount: 0,
    });
    expect(item.href).toBe("/q/34");
  });

  it("답변 시각은 한국 시간 24시간제로 표시한다", () => {
    expect(formatKstDateTime("2026-10-14T04:01:19Z")).toBe("2026-10-14 13:01");
    expect(formatKstDateTime("2026-10-14T15:30:00Z")).toBe("2026-10-15 00:30");
  });

  it("작성자가 없으면 탈퇴한 사용자로 표시한다", () => {
    const answer = { id: "a", questionNumber: 1, author: null, body: "", bodyHtml: "", bodyText: "", createdAt: "2026-10-01T00:00:00Z", parentId: null };
    const [thread] = presentThreads([{ answer, replies: [] }]);
    expect(thread?.answer.authorLabel).toBe("탈퇴한 사용자");
    expect(thread?.answer.authorDeleted).toBe(true);
  });
});

