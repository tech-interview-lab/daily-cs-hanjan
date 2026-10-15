import { GitHubWebhookReceiver } from "@/adapters/webhook/github-webhook-receiver";
import type { CacheInvalidator } from "@/application/ports/cache-invalidator";
import type { DiscussionSource } from "@/application/ports/discussion-source";
import type { WebhookReceiver } from "@/application/ports/webhook-receiver";
import { fetchAllCached, fetchOneCached } from "../cache/cached-discussions";
import { nextCacheInvalidator } from "../cache/next-cache-invalidator";

const cachedSource: DiscussionSource = {
  fetchAll: fetchAllCached,
  fetchOne: fetchOneCached,
};

export type Container = { readonly source: DiscussionSource };

export type WebhookContainer = {
  readonly receiver: WebhookReceiver | null;
  readonly invalidator: CacheInvalidator;
  readonly source: DiscussionSource;
};

export function getContainer(): Container {
  return { source: cachedSource };
}

export function getWebhookContainer(): WebhookContainer {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  return { receiver: secret ? new GitHubWebhookReceiver(secret) : null, invalidator: nextCacheInvalidator, source: cachedSource };
}
