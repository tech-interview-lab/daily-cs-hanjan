import { findCategoryBySlug } from "@/domain/policies/category-slug";
import type { DiscussionSource } from "../ports/discussion-source";
import { newestFirst, summarize, type QuestionSummary } from "./question-summary";

export type CategoryQuestions = {
  readonly category: string;
  readonly slug: string;
  readonly questions: readonly QuestionSummary[];
};

export async function listQuestionsByCategory(source: DiscussionSource, slug: string): Promise<CategoryQuestions | null> {
  const all = await source.fetchAll();
  const category = findCategoryBySlug(slug, [...new Set(all.map((item) => item.question.category))]);
  if (!category) return null;
  const questions = all
    .filter((item) => item.question.category === category)
    .map(summarize)
    .sort(newestFirst);
  return { category, slug, questions };
}
