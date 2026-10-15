import { toCategorySlug } from "@/domain/policies/category-slug";
import type { DiscussionSource } from "../ports/discussion-source";

export type CategorySummary = {
  readonly name: string;
  readonly slug: string;
  readonly questionCount: number;
};

export async function listCategories(source: DiscussionSource): Promise<CategorySummary[]> {
  const counts = new Map<string, number>();
  for (const { question } of await source.fetchAll()) {
    counts.set(question.category, (counts.get(question.category) ?? 0) + 1);
  }
  return [...counts]
    .map(([name, questionCount]) => ({ name, slug: toCategorySlug(name), questionCount }))
    .sort((a, b) => b.questionCount - a.questionCount || a.name.localeCompare(b.name, "ko"));
}
