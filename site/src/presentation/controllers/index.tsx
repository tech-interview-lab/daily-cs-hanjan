import { notFound } from "next/navigation";
import { after, connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import type { CacheInvalidator } from "@/application/ports/cache-invalidator";
import type { DiscussionSource } from "@/application/ports/discussion-source";
import type { SearchIndex } from "@/application/ports/search-index";
import type { WebhookReceiver } from "@/application/ports/webhook-receiver";
import { searchQuestions } from "@/application/usecases/search-questions";
import { getQuestionDetail, listQuestionNumbers } from "@/application/usecases/get-question-detail";
import { handleDiscussionEvent } from "@/application/usecases/handle-discussion-event";
import { warmQuestionCache } from "@/application/usecases/warm-question-cache";
import { listCategories } from "@/application/usecases/list-categories";
import { listAnswersByAuthor, listAuthors } from "@/application/usecases/list-authors";
import { listQuestionsByCategory } from "@/application/usecases/list-questions-by-category";
import { listRecentQuestions } from "@/application/usecases/list-recent-questions";
import {
  presentAuthorNav,
  presentAuthorPage,
  presentCategoryPage,
  presentNavItems,
  presentQuestionDetail,
  presentQuestionItem,
  presentSearch,
  presentThreads,
} from "../presenters";
import { SearchView } from "../views/SearchView";
import { AuthorView } from "../views/AuthorView";
import { CategoryView } from "../views/CategoryView";
import { HomeView } from "../views/HomeView";
import { NotFoundView } from "../views/NotFoundView";
import { QuestionDetailView } from "../views/QuestionDetailView";
import { RootShell } from "../views/RootShell";

export type Deps = { readonly source: DiscussionSource };

const RECENT_LIMIT = 10;
const REPOSITORY_URL = "https://github.com/tech-interview-lab/daily-cs-hanjan";

export const SITE_NAME = "CS한잔";

export async function renderRootLayout(deps: Deps, children: ReactNode) {
  const [categories, authors] = await Promise.all([listCategories(deps.source), listAuthors(deps.source)]);
  return (
    <RootShell vm={{ categories: presentNavItems(categories), authors: presentAuthorNav(authors), discussionsUrl: `${REPOSITORY_URL}/discussions`, repositoryUrl: REPOSITORY_URL }}>
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

function parseQuestionNumber(param: string): number | null {
  return /^[1-9]\d{0,8}$/.test(param) ? Number(param) : null;
}

export async function renderQuestion(deps: Deps, param: string) {
  const number = parseQuestionNumber(param);
  const detail = number === null ? null : await getQuestionDetail(deps.source, number);
  if (!detail) notFound();
  return <QuestionDetailView vm={presentQuestionDetail(detail)} />;
}

export async function questionStaticParams(deps: Deps) {
  return (await listQuestionNumbers(deps.source)).map((number) => ({ number: String(number) }));
}

export async function questionTitle(deps: Deps, param: string): Promise<string> {
  const number = parseQuestionNumber(param);
  const detail = number === null ? null : await getQuestionDetail(deps.source, number);
  if (!detail) return "페이지를 찾을 수 없습니다";
  return detail.text.length > 40 ? `${detail.text.slice(0, 40)}…` : detail.text;
}

const NO_STORE = { "Cache-Control": "no-store" };

export async function answersResponse(deps: Deps, param: string): Promise<Response> {
  await connection();
  const number = parseQuestionNumber(param);
  const detail = number === null ? null : await getQuestionDetail(deps.source, number);
  if (!detail) return Response.json({ error: "not found" }, { status: 404, headers: NO_STORE });
  return Response.json(presentThreads(detail.threads), { headers: NO_STORE });
}

export type WebhookDeps = {
  readonly receiver: WebhookReceiver | null;
  readonly invalidator: CacheInvalidator;
  readonly source: DiscussionSource;
};

export async function webhookResponse(deps: WebhookDeps, request: Request): Promise<Response> {
  if (!deps.receiver) {
    console.error("GITHUB_WEBHOOK_SECRET이 설정되지 않아 웹훅을 처리할 수 없습니다.");
    return Response.json({ error: "webhook not configured" }, { status: 500 });
  }
  const result = handleDiscussionEvent(
    { receiver: deps.receiver, invalidator: deps.invalidator },
    {
      body: await request.text(),
      signature: request.headers.get("x-hub-signature-256"),
      eventName: request.headers.get("x-github-event"),
    },
  );
  switch (result.kind) {
    case "invalid-signature":
      return Response.json({ error: "invalid signature" }, { status: 401 });
    case "ping":
      return Response.json({ ok: true });
    case "ignored":
      return Response.json({ ignored: result.reason }, { status: 202 });
    case "discussion-changed":
      // 응답을 먼저 돌려주고, 다음 방문자가 GitHub 조회를 기다리지 않도록 캐시를 미리 채운다
      after(async () => {
        try {
          const outcome = await warmQuestionCache({ source: deps.source, invalidator: deps.invalidator }, result);
          if (outcome !== "warmed") console.warn(`질문 ${result.questionNumber}: GitHub 조회에 변경이 아직 반영되지 않아 캐시를 비운 채 두었습니다.`);
        } catch (error) {
          console.error(`질문 ${result.questionNumber} 캐시 미리 채우기 실패`, error);
        }
      });
      return Response.json({ revalidated: result.questionNumber });
  }
}

export async function renderAuthor(deps: Deps, login: string) {
  const result = await listAnswersByAuthor(deps.source, login);
  if (!result) notFound();
  return <AuthorView vm={presentAuthorPage(result)} />;
}

export async function authorStaticParams(deps: Deps) {
  return (await listAuthors(deps.source)).map((author) => ({ login: author.login }));
}

export async function authorTitle(deps: Deps, login: string): Promise<string> {
  const result = await listAnswersByAuthor(deps.source, login);
  return result ? `${result.login}의 답변` : "페이지를 찾을 수 없습니다";
}

export type SearchDeps = Deps & { readonly index: SearchIndex };
type SearchParams = Promise<{ q?: string | string[] }>;

async function SearchContent({ deps, searchParams }: { readonly deps: SearchDeps; readonly searchParams: SearchParams }) {
  const raw = (await searchParams).q;
  const query = Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");
  const [outcome, categories] = await Promise.all([searchQuestions(deps, query), listCategories(deps.source)]);
  return <SearchView vm={presentSearch(outcome, presentNavItems(categories))} />;
}

// 검색어는 요청마다 달라서(searchParams) 이 부분만 Suspense 안에서 그린다(Cache Components 규칙)
export function renderSearch(deps: SearchDeps, searchParams: SearchParams) {
  return (
    <Suspense fallback={<SearchView vm={{ query: "", summary: null, results: [], categories: [] }} />}>
      <SearchContent deps={deps} searchParams={searchParams} />
    </Suspense>
  );
}
