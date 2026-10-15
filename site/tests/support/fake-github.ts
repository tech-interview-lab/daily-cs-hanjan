type Json = Record<string, any>;

export type FakeGitHubOptions = {
  discussionPageSize?: number;
  firstPageComments?: number;
  dropComment?: boolean;
};

export type FakeGitHub = { fetchImpl: typeof fetch; calls: string[]; authHeaders: string[] };

export function createFakeGitHub(raw: Json[], options: FakeGitHubOptions = {}): FakeGitHub {
  const pageSize = options.discussionPageSize ?? 2;
  const firstPageComments = options.firstPageComments ?? 2;
  const calls: string[] = [];
  const authHeaders: string[] = [];

  const withCommentPage = (d: Json, from: number, size: number): Json => {
    const all: Json[] = d.comments.nodes;
    const end = Math.min(from + size, all.length);
    const slice = options.dropComment && from === 0 ? all.slice(0, -1) : all.slice(from, end);
    return {
      ...d,
      comments: {
        totalCount: d.comments.totalCount,
        pageInfo: { hasNextPage: end < all.length, endCursor: String(end) },
        nodes: slice,
      },
    };
  };

  const fetchImpl = (async (_url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body)) as { query: string; variables: Json };
    authHeaders.push(String((init.headers as Record<string, string>)["Authorization"]));
    const { query, variables } = body;
    let data: Json;

    if (query.includes("ListDiscussions")) {
      calls.push("list");
      const start = variables.cursor ? Number(variables.cursor) : 0;
      const end = Math.min(start + pageSize, raw.length);
      data = {
        repository: {
          discussions: {
            pageInfo: { hasNextPage: end < raw.length, endCursor: String(end) },
            nodes: raw.slice(start, end).map((d) => withCommentPage(d, 0, firstPageComments)),
          },
        },
      };
    } else if (query.includes("GetDiscussion")) {
      calls.push("one");
      const found = raw.find((d) => d.number === variables.number);
      data = { repository: { discussion: found ? withCommentPage(found, 0, firstPageComments) : null } };
    } else if (query.includes("MoreComments")) {
      calls.push("more");
      const found = raw.find((d) => d.id === variables.id);
      const page = found ? withCommentPage(found, Number(variables.cursor), firstPageComments) : null;
      data = { node: page ? { comments: page.comments } : null };
    } else {
      throw new Error(`알 수 없는 쿼리: ${query.slice(0, 40)}`);
    }
    return new Response(JSON.stringify({ data }), { status: 200 });
  }) as unknown as typeof fetch;

  return { fetchImpl, calls, authHeaders };
}
