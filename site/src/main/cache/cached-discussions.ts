import { cacheLife, cacheTag } from "next/cache";
import type { QuestionWithAnswers } from "@/application/ports/discussion-source";
import { createSourceFromEnv } from "../container/source-from-env";

export const LIST_TAG = "discussions";

export function questionTag(number: number): string {
  return `q-${number}`;
}

// "use cache" 함수는 직렬화 가능한 값만 캡처할 수 있어 어댑터를 안에서 만든다.
export async function fetchAllCached(): Promise<readonly QuestionWithAnswers[]> {
  "use cache";
  cacheTag(LIST_TAG);
  cacheLife("hours");
  return createSourceFromEnv().fetchAll();
}

export async function fetchOneCached(number: number): Promise<QuestionWithAnswers | null> {
  "use cache";
  cacheTag(questionTag(number));
  cacheLife("hours");
  return createSourceFromEnv().fetchOne(number);
}
