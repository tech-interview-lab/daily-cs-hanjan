const SLUGS: Readonly<Record<string, string>> = {
  CS: "cs",
  네트워크: "network",
  데이터베이스: "database",
  시스템설계: "system-design",
  AI: "ai",
  협업: "collaboration",
};

export function toCategorySlug(category: string): string {
  return SLUGS[category] ?? category;
}

export function findCategoryBySlug(slug: string, categories: readonly string[]): string | null {
  return categories.find((category) => toCategorySlug(category) === slug) ?? null;
}
