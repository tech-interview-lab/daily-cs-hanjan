import type { CategorySummary } from "@/application/usecases/list-categories";
import type { AnswerThread, QuestionDetail } from "@/application/usecases/get-question-detail";
import type { CategoryQuestions } from "@/application/usecases/list-questions-by-category";
import type { AuthorAnswers, AuthorSummary } from "@/application/usecases/list-authors";
import type { SearchOutcome } from "@/application/usecases/search-questions";
import type { QuestionSummary } from "@/application/usecases/question-summary";
import type { Answer } from "@/domain/entities/answer";
import type {
  AnswerVM,
  AuthorPageVM,
  CategoryPageVM,
  NavItemVM,
  QuestionDetailVM,
  QuestionItemVM,
  SearchPageVM,
  ThreadVM,
} from "../viewmodels";

const KST_DATE = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" });

const KST_DATE_TIME = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

export const DELETED_AUTHOR_LABEL = "탈퇴한 사용자";

export function formatKstDate(iso: string): string {
  return KST_DATE.format(new Date(iso));
}

export function formatKstDateTime(iso: string): string {
  return KST_DATE_TIME.format(new Date(iso));
}

export function authorHref(login: string): string {
  return `/author/${encodeURIComponent(login)}`;
}

export function questionHref(number: number): string {
  return `/q/${number}`;
}

export function categoryHref(slug: string): string {
  return `/category/${encodeURIComponent(slug)}`;
}

export function presentNavItems(categories: readonly CategorySummary[]): NavItemVM[] {
  return categories.map((category) => ({
    label: category.name,
    href: categoryHref(category.slug),
    countText: String(category.questionCount),
    countLabel: `질문 ${category.questionCount}개`,
  }));
}

export function presentQuestionItem(question: QuestionSummary): QuestionItemVM {
  return {
    number: question.number,
    text: question.text,
    href: questionHref(question.number),
    categoryLabel: question.category,
    categoryHref: categoryHref(question.categorySlug),
    dateText: formatKstDate(question.createdAt),
    dateTime: question.createdAt,
    statusLabel: question.closed ? "마감" : "진행 중",
    answerCountText: `답변 ${question.answerCount}`,
  };
}

export function presentCategoryPage(result: CategoryQuestions): CategoryPageVM {
  return {
    title: result.category,
    countText: `질문 ${result.questions.length}개`,
    questions: result.questions.map(presentQuestionItem),
  };
}

function presentAnswer(answer: Answer): AnswerVM {
  return {
    id: answer.id,
    authorLabel: answer.author ?? DELETED_AUTHOR_LABEL,
    authorDeleted: answer.author === null,
    authorHref: answer.author ? authorHref(answer.author) : null,
    authorAvatarUrl: answer.authorAvatarUrl,
    dateText: formatKstDateTime(answer.createdAt),
    dateTime: answer.createdAt,
    bodyHtml: answer.bodyHtml,
  };
}

export function presentThreads(threads: readonly AnswerThread[]): ThreadVM[] {
  return threads.map((thread) => ({ answer: presentAnswer(thread.answer), replies: thread.replies.map(presentAnswer) }));
}

export function presentQuestionDetail(detail: QuestionDetail): QuestionDetailVM {
  return {
    number: detail.number,
    text: detail.text,
    note: detail.note,
    categoryLabel: detail.category,
    categoryHref: categoryHref(detail.categorySlug),
    dateText: formatKstDate(detail.createdAt),
    dateTime: detail.createdAt,
    statusLabel: detail.closed ? "마감" : "진행 중",
    discussionUrl: detail.url,
    pollUrl: `/api/questions/${detail.number}/answers`,
    threads: presentThreads(detail.threads),
  };
}

export function presentAuthorNav(authors: readonly AuthorSummary[]): NavItemVM[] {
  return authors.map((author) => ({
    label: author.login,
    href: authorHref(author.login),
    avatarUrl: author.avatarUrl,
  }));
}

export function presentAuthorPage(result: AuthorAnswers): AuthorPageVM {
  return {
    login: result.login,
    avatarUrl: result.avatarUrl,
    profileUrl: `https://github.com/${encodeURIComponent(result.login)}`,
    answers: result.answers.map(({ answer, question }) => ({
      id: answer.id,
      questionText: question.text,
      questionHref: questionHref(question.number),
      categoryLabel: question.category,
      categoryHref: categoryHref(question.categorySlug),
      dateText: formatKstDateTime(answer.createdAt),
      dateTime: answer.createdAt,
      bodyHtml: answer.bodyHtml,
    })),
  };
}

export function presentSearch(outcome: SearchOutcome, categories: readonly NavItemVM[]): SearchPageVM {
  const summary = outcome.query
    ? outcome.results.length ? `"${outcome.query}" 검색 결과 질문 ${outcome.results.length}개` : null
    : null;
  return {
    query: outcome.query,
    summary,
    categories,
    results: outcome.results.map(({ question, hits }) => ({
      number: question.number,
      titleSegments: hits.find((hit) => hit.document.field === "question")?.excerpt ?? [{ text: question.text, match: false }],
      href: questionHref(question.number),
      categoryLabel: question.category,
      categoryHref: categoryHref(question.categorySlug),
      dateText: formatKstDate(question.createdAt),
      dateTime: question.createdAt,
      excerpts: hits
        .filter((hit) => hit.document.field === "answer")
        .map((hit) => ({ label: `답변 · ${hit.document.author ?? DELETED_AUTHOR_LABEL}`, segments: hit.excerpt })),
    })),
  };
}
