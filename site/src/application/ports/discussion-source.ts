import type { Answer } from "@/domain/entities/answer";
import type { Question } from "@/domain/entities/question";

export type QuestionWithAnswers = {
  readonly question: Question;
  readonly answers: readonly Answer[];
};

export interface DiscussionSource {
  fetchAll(): Promise<readonly QuestionWithAnswers[]>;
  fetchOne(number: number): Promise<QuestionWithAnswers | null>;
}
