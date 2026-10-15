import { describe, expect, it } from "vitest";
import { SubstringSearch } from "@/adapters/search/substring-search";
import type { SearchDocument } from "@/application/ports/search-index";

const doc = (text: string, field: SearchDocument["field"] = "answer"): SearchDocument => ({ questionNumber: 1, field, author: "a", text });
const search = new SubstringSearch();
const joined = (segments: readonly { text: string; match: boolean }[]) => segments.map((s) => (s.match ? `[${s.text}]` : s.text)).join("");

describe("SubstringSearch", () => {
  it("조사가 붙은 단어도 찾는다", () => {
    const [hit] = search.search([doc("캐시는 자주 쓰는 데이터를 저장합니다. 캐시를 쓰면 빠릅니다.")], "캐시");
    expect(hit?.matchCount).toBe(2);
    expect(joined(hit!.excerpt)).toBe("[캐시]는 자주 쓰는 데이터를 저장합니다. [캐시]를 쓰면 빠릅니다.");
  });

  it("대소문자와 앞뒤 공백, 줄바꿈 차이를 무시한다", () => {
    const [hit] = search.search([doc("TCP와\n\nUDP")], "  tcp와 udp ");
    expect(joined(hit!.excerpt)).toBe("[TCP와 UDP]");
  });

  it("긴 본문은 첫 일치 주변만 발췌하고 잘린 쪽에 말줄임을 붙인다", () => {
    const text = `${"가".repeat(100)}인덱스${"나".repeat(200)}`;
    const [hit] = search.search([doc(text)], "인덱스");
    const shown = joined(hit!.excerpt);
    expect(shown.startsWith("…")).toBe(true);
    expect(shown.endsWith("…")).toBe(true);
    expect(shown).toContain("[인덱스]");
    expect(shown.length).toBeLessThan(140);
  });

  it("질문 문장은 길어도 자르지 않고 전체를 나눈다(제목으로 표시)", () => {
    const text = `${"가".repeat(100)}인덱스${"나".repeat(200)}`;
    const [hit] = search.search([doc(text, "question")], "인덱스");
    expect(joined(hit!.excerpt)).toBe(`${"가".repeat(100)}[인덱스]${"나".repeat(200)}`);
  });

  it("일치가 없거나 검색어가 비면 결과가 없다", () => {
    expect(search.search([doc("TCP")], "UDP")).toEqual([]);
    expect(search.search([doc("TCP")], "   ")).toEqual([]);
  });

  it("검색어의 HTML 특수문자도 글자 그대로 비교한다", () => {
    const [hit] = search.search([doc("<script>는 태그입니다")], "<script>");
    expect(joined(hit!.excerpt)).toBe("[<script>]는 태그입니다");
  });
});
