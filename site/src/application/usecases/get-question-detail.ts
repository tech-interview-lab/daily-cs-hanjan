import type { Answer } from "@/domain/entities/answer";
import { isAutoCloseComment } from "@/domain/policies/auto-close-policy";
import { toCategorySlug } from "@/domain/policies/category-slug";
import type { DiscussionSource } from "../ports/discussion-source";

export type AnswerThread = {
  readonly answer: Answer;
  readonly replies: readonly Answer[];
};

export type QuestionDetail = {
  readonly number: number;
  readonly text: string;
  readonly note: string | null;
  readonly category: string;
  readonly categorySlug: string;
  readonly createdAt: string;
  readonly closed: boolean;
  readonly url: string;
  readonly threads: readonly AnswerThread[];
};

const byCreatedAt = (a: Answer, b: Answer) => a.createdAt.localeCompare(b.createdAt);

export async function getQuestionDetail(source: DiscussionSource, number: number): Promise<QuestionDetail | null> {
  const item = await source.fetchOne(number);
  if (!item) return null;

  const answers = item.answers.filter((answer) => !isAutoCloseComment(answer.body));
  const threads = answers
    .filter((answer) => answer.parentId === null)
    .sort(byCreatedAt)
    .map((answer) => ({
      answer,
      replies: answers.filter((reply) => reply.parentId === answer.id).sort(byCreatedAt),
    }));

  const { question } = item;
  return {
    number: question.number,
    text: question.text,
    note: question.note,
    category: question.category,
    categorySlug: toCategorySlug(question.category),
    createdAt: question.createdAt,
    closed: question.closed,
    url: question.url,
    threads,
  };
}

export async function listQuestionNumbers(source: DiscussionSource): Promise<number[]> {
  return (await source.fetchAll()).map((item) => item.question.number);
}
