import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { GitHubGraphqlSource } from "@/adapters/source/github-graphql-source";
import { isAutoCloseComment } from "@/domain/policies/auto-close-policy";
import { createFakeGitHub, type FakeGitHubOptions } from "../support/fake-github";
import { runDiscussionSourceContract } from "../support/discussion-source-contract";

const raw = JSON.parse(readFileSync(new URL("../fixtures/github-discussions.raw.json", import.meta.url), "utf-8"));

function create(options?: FakeGitHubOptions, token = "test-token") {
  const fake = createFakeGitHub(raw, options);
  const source = new GitHubGraphqlSource({ token, owner: "o", repo: "r", fetchImpl: fake.fetchImpl });
  return { fake, source };
}

runDiscussionSourceContract("GitHubGraphqlSource", () => create().source);

describe("GitHubGraphqlSource", () => {
  it("질문이 아닌 글(공지)은 제외한다", async () => {
    const { source } = create();
    const numbers = (await source.fetchAll()).map((i) => i.question.number);
    expect(numbers).toEqual([2, 3, 4]);
    expect(await source.fetchOne(1)).toBeNull();
  });

  it("카테고리를 제목 접두어에서 추출한다", async () => {
    const { source } = create();
    const categories = (await source.fetchAll()).map((i) => i.question.category);
    expect(categories).toEqual(["네트워크", "AI", "CS"]);
  });

  it("질문 문장을 본문에서 추출하고 형식이 다르면 제목을 쓴다", async () => {
    const { source } = create();
    const texts = (await source.fetchAll()).map((i) => i.question.text);
    expect(texts).toEqual(["TCP와 UDP의 차이는?", "[AI] 2026-10-02 오늘의 질문", "동기와 비동기의 차이는?"]);
  });

  it("글 목록과 댓글을 페이지 단위로 끝까지 가져온다", async () => {
    const { source, fake } = create({ discussionPageSize: 2, firstPageComments: 2 });
    const all = await source.fetchAll();
    const q2 = all.find((i) => i.question.number === 2)!;
    expect(q2.answers).toHaveLength(4);
    expect(fake.calls.filter((c) => c === "list")).toHaveLength(2);
    expect(fake.calls.filter((c) => c === "more").length).toBeGreaterThan(0);
  });

  it("작성자가 null인 답변과 빈 본문을 그대로 유지한다", async () => {
    const { source } = create();
    const q2 = (await source.fetchOne(2))!;
    const deleted = q2.answers.find((a) => a.id === "C_2_2")!;
    expect(deleted.author).toBeNull();
    expect(deleted.body).toBe("");
    expect(deleted.bodyHtml).toBe("");
  });

  it("대댓글을 parentId와 함께 펼친다", async () => {
    const { source } = create();
    const q4 = (await source.fetchOne(4))!;
    expect(q4.answers.map((a) => [a.id, a.parentId])).toEqual([
      ["C_4_1", null],
      ["R_4_1_1", "C_4_1"],
    ]);
  });

  it("마감 댓글은 제외하지 않고 원문 그대로 반환한다 (제외는 정책의 몫)", async () => {
    const { source } = create();
    const q2 = (await source.fetchOne(2))!;
    const closing = q2.answers.filter((a) => isAutoCloseComment(a.body));
    expect(closing.map((a) => a.id)).toEqual(["C_2_4"]);
    expect(q2.answers.filter((a) => !isAutoCloseComment(a.body))).toHaveLength(3);
  });

  it("작성자 아바타는 GitHub 이미지 서버의 https 주소만 남긴다", async () => {
    const { source } = create();
    const answers = (await source.fetchAll()).flatMap((i) => i.answers);
    const byAuthor = (login: string | null) => answers.find((a) => a.author === login)?.authorAvatarUrl;
    expect(byAuthor("lapera00")).toMatch(/^https:\/\/avatars\.githubusercontent\.com\//);
    expect(byAuthor("rn1217")).toBeNull();
    expect(byAuthor(null)).toBeNull();
  });

  it("본문 HTML을 살균한다", async () => {
    const { source } = create();
    const html = (await source.fetchOne(2))!.answers[0]!.bodyHtml;
    expect(html).not.toContain("<script");
    expect(html).not.toContain("onclick");
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("http://insecure.example");
    expect(html).toContain("https://example.com/a.png");
    expect(html).toContain('rel="noopener noreferrer nofollow"');
    expect(html).toContain("<strong>연결 지향</strong>");
    expect(html).toContain("😀");
  });

  it("코드블록과 표는 유지한다", async () => {
    const { source } = create();
    const html = (await source.fetchOne(2))!.answers[2]!.bodyHtml;
    expect(html).toContain("<pre><code>");
    expect(html).toContain("<table>");
  });

  it("토큰을 Authorization 헤더로만 보낸다", async () => {
    const { source, fake } = create(undefined, "secret-token");
    await source.fetchAll();
    expect(new Set(fake.authHeaders)).toEqual(new Set(["Bearer secret-token"]));
  });

  it("받은 댓글 수가 전체 수와 다르면 조용히 넘기지 않고 실패한다", async () => {
    const { source } = create({ dropComment: true, firstPageComments: 10 });
    await expect(source.fetchOne(2)).rejects.toThrow(/전체 4건/);
  });

  it("목록 조회에서 NOT_FOUND가 오면 숨기지 않고 실패한다", async () => {
    const source = new GitHubGraphqlSource({
      token: "t", owner: "o", repo: "r",
      fetchImpl: (async () =>
        new Response(JSON.stringify({ data: { repository: null }, errors: [{ type: "NOT_FOUND", message: "Could not resolve to a Repository" }] }), {
          status: 200,
        })) as unknown as typeof fetch,
    });
    await expect(source.fetchAll()).rejects.toThrow(/Could not resolve/);
  });

  it("HTTP 오류와 GraphQL 오류에서 실패하고 토큰을 메시지에 넣지 않는다", async () => {
    const http = new GitHubGraphqlSource({
      token: "secret-token", owner: "o", repo: "r",
      fetchImpl: (async () => new Response("no", { status: 401 })) as unknown as typeof fetch,
    });
    await expect(http.fetchAll()).rejects.toThrow(/HTTP 401/);

    const gql = new GitHubGraphqlSource({
      token: "secret-token", owner: "o", repo: "r",
      fetchImpl: (async () =>
        new Response(JSON.stringify({ errors: [{ message: "Bad credentials" }] }), { status: 200 })) as unknown as typeof fetch,
    });
    const error = await gql.fetchAll().catch((e: Error) => e);
    expect((error as Error).message).toContain("Bad credentials");
    expect((error as Error).message).not.toContain("secret-token");
  });
});
