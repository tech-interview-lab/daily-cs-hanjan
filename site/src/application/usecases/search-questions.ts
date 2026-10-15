import type { DiscussionSource } from "../ports/discussion-source";
import type { SearchDocument, SearchHit, SearchIndex } from "../ports/search-index";
import { isCountedAnswer } from "./answer-rules";
import { newestFirst, summarize, type QuestionSummary } from "./question-summary";

export const MAX_QUERY_LENGTH = 100;
const MAX_HITS_PER_QUESTION = 3;

export type SearchResult = {
  readonly question: QuestionSummary;
  readonly hits: readonly SearchHit[];
};

export type SearchOutcome = {
  readonly query: string;
  readonly results: readonly SearchResult[];
};

// 질문 문장과 답변 본문(마감 댓글 제외)을 검색해 질문 단위로 묶는다(FR-3).
// 질문 문장에서 일치한 질문을 먼저, 그다음 일치 횟수가 많은 순, 같으면 최신순
export async function searchQuestions(deps: { source: DiscussionSource; index: SearchIndex }, rawQuery: string): Promise<SearchOutcome> {
  const query = rawQuery.trim().slice(0, MAX_QUERY_LENGTH);
  if (!query) return { query, results: [] };

  const items = await deps.source.fetchAll();
  const documents: SearchDocument[] = items.flatMap(({ question, answers }) => [
    { questionNumber: question.number, field: "question" as const, author: null, text: question.text },
    ...answers.filter(isCountedAnswer).map((answer) => ({
      questionNumber: question.number, field: "answer" as const, author: answer.author, text: answer.bodyText,
    })),
  ]);

  const byQuestion = new Map<number, SearchHit[]>();
  for (const hit of deps.index.search(documents, query)) {
    const list = byQuestion.get(hit.document.questionNumber) ?? [];
    list.push(hit);
    byQuestion.set(hit.document.questionNumber, list);
  }

  const results = items
    .filter(({ question }) => byQuestion.has(question.number))
    .map((item) => {
      const hits = byQuestion.get(item.question.number)!;
      hits.sort((a, b) => Number(b.document.field === "question") - Number(a.document.field === "question") || b.matchCount - a.matchCount);
      return { question: summarize(item), hits, total: hits.reduce((sum, hit) => sum + hit.matchCount, 0) };
    })
    .sort((a, b) => {
      const aTitle = a.hits[0]?.document.field === "question" ? 1 : 0;
      const bTitle = b.hits[0]?.document.field === "question" ? 1 : 0;
      return bTitle - aTitle || b.total - a.total || newestFirst(a.question, b.question);
    })
    .map(({ question, hits }) => ({ question, hits: hits.slice(0, MAX_HITS_PER_QUESTION) }));

  return { query, results };
}
