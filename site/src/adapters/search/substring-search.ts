import type { ExcerptSegment, SearchDocument, SearchHit, SearchIndex } from "@/application/ports/search-index";

const CONTEXT = 40;

// 한국어 조사(예: "캐시는")가 붙어도 찾도록 토큰이 아닌 부분 문자열로 비교한다(ADR-0003)
export class SubstringSearch implements SearchIndex {
  search(documents: readonly SearchDocument[], query: string): SearchHit[] {
    const needle = normalize(query).toLowerCase();
    if (!needle) return [];
    const hits: SearchHit[] = [];
    for (const document of documents) {
      const text = normalize(document.text);
      const positions = findAll(text.toLowerCase(), needle);
      // 질문 문장은 제목으로 통째로 보여 주므로 전체를 나누고, 답변 본문은 첫 일치 주변만 발췌한다
      const whole = document.field === "question";
      if (positions.length) hits.push({ document, matchCount: positions.length, excerpt: excerpt(text, positions, needle.length, whole) });
    }
    return hits;
  }
}

function normalize(text: string): string {
  return text.normalize("NFC").replace(/\s+/g, " ").trim();
}

function findAll(haystack: string, needle: string): number[] {
  const positions: number[] = [];
  for (let at = haystack.indexOf(needle); at !== -1; at = haystack.indexOf(needle, at + needle.length)) positions.push(at);
  return positions;
}

function excerpt(text: string, positions: number[], length: number, whole: boolean): ExcerptSegment[] {
  const first = positions[0]!;
  const start = whole ? 0 : Math.max(0, first - CONTEXT);
  const end = whole ? text.length : Math.min(text.length, first + length + CONTEXT * 2);
  const segments: ExcerptSegment[] = [];
  let cursor = start;
  for (const at of positions) {
    if (at < start || at + length > end) continue;
    if (at > cursor) segments.push({ text: text.slice(cursor, at), match: false });
    segments.push({ text: text.slice(at, at + length), match: true });
    cursor = at + length;
  }
  if (cursor < end) segments.push({ text: text.slice(cursor, end), match: false });
  if (start > 0) segments.unshift({ text: "…", match: false });
  if (end < text.length) segments.push({ text: "…", match: false });
  return segments;
}
