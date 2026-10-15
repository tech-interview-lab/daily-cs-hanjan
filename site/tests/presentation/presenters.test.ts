import { describe, expect, it } from "vitest";
import { authorHref, formatKstDate, formatKstDateTime, presentAuthorNav, presentAuthorPage, presentNavItems, presentQuestionItem, presentSearch, presentThreads } from "@/presentation/presenters";

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
    const answer = { id: "a", questionNumber: 1, author: null, authorAvatarUrl: null, body: "", bodyHtml: "", bodyText: "", createdAt: "2026-10-01T00:00:00Z", parentId: null };
    const [thread] = presentThreads([{ answer, replies: [] }]);
    expect(thread?.answer.authorLabel).toBe("탈퇴한 사용자");
    expect(thread?.answer.authorDeleted).toBe(true);
  });

  it("작성자 링크와 아바타를 담고, 탈퇴 계정은 링크가 없다", () => {
    const base = { id: "a", questionNumber: 1, body: "", bodyHtml: "", bodyText: "", createdAt: "2026-10-01T00:00:00Z", parentId: null };
    const [kept, gone] = presentThreads([
      { answer: { ...base, author: "lapera00", authorAvatarUrl: "https://avatars.githubusercontent.com/u/1" }, replies: [] },
      { answer: { ...base, id: "b", author: null, authorAvatarUrl: null }, replies: [] },
    ]);
    expect([kept?.answer.authorHref, kept?.answer.authorAvatarUrl]).toEqual(["/author/lapera00", "https://avatars.githubusercontent.com/u/1"]);
    expect([gone?.answer.authorHref, gone?.answer.authorLabel]).toEqual([null, "탈퇴한 사용자"]);
  });

  it("작성자 내비게이션과 작성자 페이지를 만든다", () => {
    expect(authorHref("a b")).toBe("/author/a%20b");
    expect(presentAuthorNav([{ login: "00kang", avatarUrl: null, answerCount: 9 }])).toEqual([
      { label: "00kang", href: "/author/00kang", countText: "9", countLabel: "답변 9개", avatarUrl: null },
    ]);
    const page = presentAuthorPage({
      login: "00kang", avatarUrl: null,
      answers: [{
        answer: { id: "a", questionNumber: 33, author: "00kang", authorAvatarUrl: null, body: "", bodyHtml: "<p>x</p>", bodyText: "", createdAt: "2026-10-14T04:05:00Z", parentId: null },
        question: { number: 33, text: "정규화", category: "데이터베이스", categorySlug: "database" },
      }],
    });
    expect([page.countText, page.profileUrl, page.answers[0]?.questionHref, page.answers[0]?.dateText]).toEqual([
      "답변 1개", "https://github.com/00kang", "/q/33", "2026-10-14 13:05",
    ]);
  });

  it("검색 결과: 질문 일치는 제목 강조로, 답변 일치는 발췌로 나누고 건수를 요약한다", () => {
    const summary = { number: 7, text: "캐시 질문", category: "CS", categorySlug: "cs", createdAt: "2026-10-01T00:00:00Z", closed: true, url: "u", answerCount: 1 };
    const vm = presentSearch({
      query: "캐시",
      results: [{
        question: summary,
        hits: [
          { document: { questionNumber: 7, field: "question", author: null, text: "캐시 질문" }, matchCount: 1, excerpt: [{ text: "캐시", match: true }, { text: " 질문", match: false }] },
          { document: { questionNumber: 7, field: "answer", author: "a", text: "캐시는" }, matchCount: 1, excerpt: [{ text: "캐시", match: true }, { text: "는", match: false }] },
        ],
      }],
    }, []);
    expect(vm.summary).toBe('"캐시" 검색 결과 질문 1개');
    expect(vm.results[0]?.titleSegments[0]).toEqual({ text: "캐시", match: true });
    expect(vm.results[0]?.excerpts.map((e) => e.label)).toEqual(["답변 · a"]);
    expect(presentSearch({ query: "x", results: [] }, []).summary).toBeNull();
  });
});

