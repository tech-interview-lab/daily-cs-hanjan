import { FixtureDiscussionSource } from "@/adapters/source/fixture-source";
import { GitHubGraphqlSource } from "@/adapters/source/github-graphql-source";
import type { DiscussionSource } from "@/application/ports/discussion-source";

const OWNER = "tech-interview-lab";
const REPO = "daily-cs-hanjan";

export function createSourceFromEnv(): DiscussionSource {
  const fixtureFile = process.env.HANJAN_FIXTURE_FILE;
  if (fixtureFile) return FixtureDiscussionSource.fromFile(fixtureFile);

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN이 없습니다. 로컬에서는 `GITHUB_TOKEN=$(gh auth token) npm run dev`로 실행하세요.");
  }
  return new GitHubGraphqlSource({ token, owner: OWNER, repo: REPO });
}
