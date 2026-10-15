import type { Answer } from "@/domain/entities/answer";
import { toCategorySlug } from "@/domain/policies/category-slug";
import type { DiscussionSource } from "../ports/discussion-source";
import { isCountedAnswer } from "./answer-rules";

export type AuthorSummary = {
  readonly login: string;
  readonly avatarUrl: string | null;
  readonly answerCount: number;
};

export type AuthorAnswer = {
  readonly answer: Answer;
  readonly question: {
    readonly number: number;
    readonly text: string;
    readonly category: string;
    readonly categorySlug: string;
  };
};

export type AuthorAnswers = {
  readonly login: string;
  readonly avatarUrl: string | null;
  readonly answers: readonly AuthorAnswer[];
};

// 작성자가 없는 답변(탈퇴한 계정)은 작성자 목록과 작성자 페이지에 들어가지 않는다
export async function listAuthors(source: DiscussionSource): Promise<AuthorSummary[]> {
  const authors = new Map<string, { avatarUrl: string | null; answerCount: number }>();
  for (const { answers } of await source.fetchAll()) {
    for (const answer of answers.filter(isCountedAnswer)) {
      if (!answer.author) continue;
      const current = authors.get(answer.author);
      authors.set(answer.author, {
        avatarUrl: current?.avatarUrl ?? answer.authorAvatarUrl,
        answerCount: (current?.answerCount ?? 0) + 1,
      });
    }
  }
  return [...authors]
    .map(([login, info]) => ({ login, ...info }))
    .sort((a, b) => b.answerCount - a.answerCount || a.login.localeCompare(b.login));
}

export async function listAnswersByAuthor(source: DiscussionSource, login: string): Promise<AuthorAnswers | null> {
  const wanted = login.toLowerCase();
  const found: AuthorAnswer[] = [];
  for (const { question, answers } of await source.fetchAll()) {
    for (const answer of answers.filter(isCountedAnswer)) {
      if (answer.author?.toLowerCase() !== wanted) continue;
      found.push({
        answer,
        question: { number: question.number, text: question.text, category: question.category, categorySlug: toCategorySlug(question.category) },
      });
    }
  }
  if (found.length === 0) return null;
  found.sort((a, b) => b.answer.createdAt.localeCompare(a.answer.createdAt));
  const first = found[0]!.answer;
  return { login: first.author!, avatarUrl: found.find((item) => item.answer.authorAvatarUrl)?.answer.authorAvatarUrl ?? null, answers: found };
}
