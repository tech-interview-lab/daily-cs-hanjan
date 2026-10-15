import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import type { DiscussionSource } from "@/application/ports/discussion-source";
import { listCategories } from "@/application/usecases/list-categories";
import { listQuestionsByCategory } from "@/application/usecases/list-questions-by-category";
import { listRecentQuestions } from "@/application/usecases/list-recent-questions";
import { presentCategoryPage, presentNavItems, presentQuestionItem } from "../presenters";
import { CategoryView } from "../views/CategoryView";
import { HomeView } from "../views/HomeView";
import { NotFoundView } from "../views/NotFoundView";
import { RootShell } from "../views/RootShell";

export type Deps = { readonly source: DiscussionSource };

const RECENT_LIMIT = 10;
const REPOSITORY_URL = "https://github.com/tech-interview-lab/daily-cs-hanjan";

export const SITE_NAME = "CS한잔";

export async function renderRootLayout(deps: Deps, children: ReactNode) {
  const categories = presentNavItems(await listCategories(deps.source));
  return (
    <RootShell vm={{ categories, discussionsUrl: `${REPOSITORY_URL}/discussions`, repositoryUrl: REPOSITORY_URL }}>
      {children}
    </RootShell>
  );
}

export async function renderHome(deps: Deps) {
  const [categories, recent] = await Promise.all([
    listCategories(deps.source),
    listRecentQuestions(deps.source, RECENT_LIMIT),
  ]);
  return <HomeView vm={{ categories: presentNavItems(categories), recentQuestions: recent.map(presentQuestionItem) }} />;
}

export async function renderCategory(deps: Deps, slug: string) {
  const result = await listQuestionsByCategory(deps.source, slug);
  if (!result) notFound();
  return <CategoryView vm={presentCategoryPage(result)} />;
}

export async function categoryStaticParams(deps: Deps) {
  return (await listCategories(deps.source)).map((category) => ({ slug: category.slug }));
}

export async function categoryTitle(deps: Deps, slug: string): Promise<string> {
  const result = await listQuestionsByCategory(deps.source, slug);
  return result ? result.category : "페이지를 찾을 수 없습니다";
}

export function renderNotFound() {
  return <NotFoundView />;
}
