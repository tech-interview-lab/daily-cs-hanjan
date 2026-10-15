import { revalidateTag } from "next/cache";
import type { CacheInvalidator } from "@/application/ports/cache-invalidator";
import { LIST_TAG, questionTag } from "./cached-discussions";

// "max"는 무효화 직후 방문자에게 옛 내용을 한 번 더 보여 준다. 다음 요청이 바로 새 데이터를 받도록 expire: 0
const IMMEDIATE = { expire: 0 };

export const nextCacheInvalidator: CacheInvalidator = {
  invalidateQuestion: (number) => revalidateTag(questionTag(number), IMMEDIATE),
  invalidateLists: () => revalidateTag(LIST_TAG, IMMEDIATE),
};
