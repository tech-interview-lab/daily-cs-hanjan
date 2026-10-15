import type { CategorySummary } from "@/application/usecases/list-categories";
import type { CategoryQuestions } from "@/application/usecases/list-questions-by-category";
import type { QuestionSummary } from "@/application/usecases/question-summary";
import type { CategoryPageVM, NavItemVM, QuestionItemVM } from "../viewmodels";

const KST_DATE = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" });

export function formatKstDate(iso: string): string {
  return KST_DATE.format(new Date(iso));
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
    // 질문 상세 페이지(S2) 전까지는 원본 Discussion으로 연결한다.
    href: question.url,
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
