import { readFileSync } from "node:fs";
import type { DiscussionSource, QuestionWithAnswers } from "@/application/ports/discussion-source";

export class FixtureDiscussionSource implements DiscussionSource {
  constructor(private readonly items: readonly QuestionWithAnswers[]) {}

  static fromFile(path: string): FixtureDiscussionSource {
    return new FixtureDiscussionSource(JSON.parse(readFileSync(path, "utf-8")) as QuestionWithAnswers[]);
  }

  async fetchAll(): Promise<readonly QuestionWithAnswers[]> {
    return this.items;
  }

  async fetchOne(number: number): Promise<QuestionWithAnswers | null> {
    return this.items.find((item) => item.question.number === number) ?? null;
  }
}
