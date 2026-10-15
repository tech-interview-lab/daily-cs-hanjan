import { isAutoCloseComment } from "@/domain/policies/auto-close-policy";
import { toCategorySlug } from "@/domain/policies/category-slug";
import type { QuestionWithAnswers } from "../ports/discussion-source";

export type QuestionSummary = {
  readonly number: number;
  readonly text: string;
  readonly category: string;
  readonly categorySlug: string;
  readonly createdAt: string;
  readonly closed: boolean;
  readonly url: string;
  readonly answerCount: number;
};

export function summarize({ question, answers }: QuestionWithAnswers): QuestionSummary {
  return {
    number: question.number,
    text: question.text,
    category: question.category,
    categorySlug: toCategorySlug(question.category),
    createdAt: question.createdAt,
    closed: question.closed,
    url: question.url,
    answerCount: answers.filter((answer) => !isAutoCloseComment(answer.body)).length,
  };
}

export function newestFirst(a: QuestionSummary, b: QuestionSummary): number {
  return b.createdAt.localeCompare(a.createdAt) || b.number - a.number;
}
