import type { DiscussionSource } from "../ports/discussion-source";
import { newestFirst, summarize, type QuestionSummary } from "./question-summary";

export async function listRecentQuestions(source: DiscussionSource, limit: number): Promise<QuestionSummary[]> {
  return (await source.fetchAll()).map(summarize).sort(newestFirst).slice(0, limit);
}
