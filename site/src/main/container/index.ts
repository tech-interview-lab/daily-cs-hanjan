import type { DiscussionSource } from "@/application/ports/discussion-source";
import { fetchAllCached, fetchOneCached } from "../cache/cached-discussions";

const cachedSource: DiscussionSource = {
  fetchAll: fetchAllCached,
  fetchOne: fetchOneCached,
};

export type Container = { readonly source: DiscussionSource };

export function getContainer(): Container {
  return { source: cachedSource };
}
