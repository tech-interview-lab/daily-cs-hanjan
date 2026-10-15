import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { FixtureDiscussionSource } from "@/adapters/source/fixture-source";
import { GitHubGraphqlSource } from "@/adapters/source/github-graphql-source";
import { createFakeGitHub } from "../support/fake-github";
import { runDiscussionSourceContract } from "../support/discussion-source-contract";

const raw = JSON.parse(readFileSync(new URL("../fixtures/github-discussions.raw.json", import.meta.url), "utf-8"));
const sample = () =>
  new GitHubGraphqlSource({ token: "t", owner: "o", repo: "r", fetchImpl: createFakeGitHub(raw).fetchImpl }).fetchAll();

runDiscussionSourceContract("FixtureDiscussionSource", async () => new FixtureDiscussionSource(await sample()));

describe("FixtureDiscussionSource.fromFile", () => {
  it("JSON 파일에서 읽어 같은 내용을 돌려준다", async () => {
    const items = await sample();
    const dir = mkdtempSync(join(tmpdir(), "hanjan-fixture-"));
    const file = join(dir, "discussions.json");
    writeFileSync(file, JSON.stringify(items), "utf-8");
    const source = FixtureDiscussionSource.fromFile(file);
    expect(await source.fetchAll()).toEqual(items);
  });
});
