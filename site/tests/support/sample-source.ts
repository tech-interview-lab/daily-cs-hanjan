import { readFileSync } from "node:fs";
import { FixtureDiscussionSource } from "@/adapters/source/fixture-source";
import { GitHubGraphqlSource } from "@/adapters/source/github-graphql-source";
import { createFakeGitHub } from "./fake-github";

const raw = JSON.parse(readFileSync(new URL("../fixtures/github-discussions.raw.json", import.meta.url), "utf-8"));

export async function createSampleSource(): Promise<FixtureDiscussionSource> {
  const github = new GitHubGraphqlSource({ token: "t", owner: "o", repo: "r", fetchImpl: createFakeGitHub(raw).fetchImpl });
  return new FixtureDiscussionSource(await github.fetchAll());
}
