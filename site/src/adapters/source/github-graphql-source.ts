import type { Answer } from "@/domain/entities/answer";
import type { Question } from "@/domain/entities/question";
import { extractCategory } from "@/domain/policies/category-extractor";
import { extractQuestionText } from "@/domain/policies/question-text";
import type { DiscussionSource, QuestionWithAnswers } from "@/application/ports/discussion-source";
import { sanitizeBodyHtml } from "./sanitize";

const ENDPOINT = "https://api.github.com/graphql";
const DISCUSSIONS_PAGE = 25;
const COMMENTS_PAGE = 50;
const REPLIES_PAGE = 50;

const COMMENT_FIELDS = `
  id body bodyHTML bodyText createdAt
  author { login }
  replies(first: ${REPLIES_PAGE}) {
    totalCount
    nodes { id body bodyHTML bodyText createdAt author { login } }
  }
`;

const DISCUSSION_FIELDS = `
  id number title closed createdAt url body bodyHTML
  comments(first: ${COMMENTS_PAGE}) {
    totalCount
    pageInfo { hasNextPage endCursor }
    nodes { ${COMMENT_FIELDS} }
  }
`;

const LIST_QUERY = `
  query ListDiscussions($owner: String!, $name: String!, $cursor: String) {
    repository(owner: $owner, name: $name) {
      discussions(first: ${DISCUSSIONS_PAGE}, after: $cursor, orderBy: { field: CREATED_AT, direction: ASC }) {
        pageInfo { hasNextPage endCursor }
        nodes { ${DISCUSSION_FIELDS} }
      }
    }
  }
`;

const ONE_QUERY = `
  query GetDiscussion($owner: String!, $name: String!, $number: Int!) {
    repository(owner: $owner, name: $name) {
      discussion(number: $number) { ${DISCUSSION_FIELDS} }
    }
  }
`;

const MORE_COMMENTS_QUERY = `
  query MoreComments($id: ID!, $cursor: String) {
    node(id: $id) {
      ... on Discussion {
        comments(first: ${COMMENTS_PAGE}, after: $cursor) {
          pageInfo { hasNextPage endCursor }
          nodes { ${COMMENT_FIELDS} }
        }
      }
    }
  }
`;

type RawAuthor = { login: string } | null;
type RawReply = { id: string; body: string; bodyHTML: string; bodyText: string; createdAt: string; author: RawAuthor };
type RawComment = RawReply & { replies: { totalCount: number; nodes: RawReply[] } };
type PageInfo = { hasNextPage: boolean; endCursor: string | null };
type RawDiscussion = {
  id: string;
  number: number;
  title: string;
  closed: boolean;
  createdAt: string;
  url: string;
  body: string;
  bodyHTML: string;
  comments: { totalCount: number; pageInfo: PageInfo; nodes: RawComment[] };
};

export type GitHubGraphqlSourceOptions = {
  token: string;
  owner: string;
  repo: string;
  fetchImpl?: typeof fetch;
};

export class GitHubGraphqlSource implements DiscussionSource {
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly options: GitHubGraphqlSourceOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async fetchAll(): Promise<readonly QuestionWithAnswers[]> {
    const results: QuestionWithAnswers[] = [];
    let cursor: string | null = null;
    for (;;) {
      const data: { repository: { discussions: { pageInfo: PageInfo; nodes: RawDiscussion[] } } } =
        await this.request(LIST_QUERY, { cursor });
      const page = data.repository.discussions;
      for (const raw of page.nodes) {
        const mapped = await this.toQuestionWithAnswers(raw);
        if (mapped) results.push(mapped);
      }
      if (!page.pageInfo.hasNextPage) break;
      cursor = page.pageInfo.endCursor;
    }
    return results;
  }

  async fetchOne(number: number): Promise<QuestionWithAnswers | null> {
    const data: { repository: { discussion: RawDiscussion | null } } = await this.request(ONE_QUERY, { number });
    const raw = data.repository.discussion;
    return raw ? this.toQuestionWithAnswers(raw) : null;
  }

  private async toQuestionWithAnswers(raw: RawDiscussion): Promise<QuestionWithAnswers | null> {
    const category = extractCategory(raw.title);
    if (!category) return null;

    const comments = await this.collectComments(raw);
    const question: Question = {
      number: raw.number,
      title: raw.title,
      text: extractQuestionText(raw.body) ?? raw.title,
      category,
      createdAt: raw.createdAt,
      closed: raw.closed,
      url: raw.url,
      bodyHtml: sanitizeBodyHtml(raw.bodyHTML),
    };
    return { question, answers: comments.flatMap((c) => toAnswers(raw.number, c)) };
  }

  private async collectComments(raw: RawDiscussion): Promise<RawComment[]> {
    const comments = [...raw.comments.nodes];
    let pageInfo = raw.comments.pageInfo;
    while (pageInfo.hasNextPage) {
      const data: { node: { comments: { pageInfo: PageInfo; nodes: RawComment[] } } | null } =
        await this.request(MORE_COMMENTS_QUERY, { id: raw.id, cursor: pageInfo.endCursor });
      if (!data.node) throw new Error(`Discussion ${raw.number}의 댓글을 추가로 불러오지 못했습니다.`);
      comments.push(...data.node.comments.nodes);
      pageInfo = data.node.comments.pageInfo;
    }
    if (comments.length !== raw.comments.totalCount) {
      throw new Error(`Discussion ${raw.number}: 댓글 ${comments.length}건만 받았습니다(전체 ${raw.comments.totalCount}건).`);
    }
    return comments;
  }

  private async request<T>(query: string, variables: Record<string, unknown>): Promise<T> {
    const response = await this.fetchImpl(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.options.token}`,
        "Content-Type": "application/json",
        "User-Agent": "cs-hanjan-site",
      },
      body: JSON.stringify({
        query,
        variables: { owner: this.options.owner, name: this.options.repo, ...variables },
      }),
    });
    if (!response.ok) throw new Error(`GitHub GraphQL 요청 실패: HTTP ${response.status}`);
    const json = (await response.json()) as { data?: T; errors?: { message: string }[] };
    if (json.errors?.length) {
      throw new Error(`GitHub GraphQL 오류: ${json.errors.map((e) => e.message).join("; ")}`);
    }
    if (!json.data) throw new Error("GitHub GraphQL 응답에 data가 없습니다.");
    return json.data;
  }
}

function toAnswers(questionNumber: number, comment: RawComment): Answer[] {
  if (comment.replies.nodes.length !== comment.replies.totalCount) {
    throw new Error(`댓글 ${comment.id}: 대댓글 ${comment.replies.nodes.length}건만 받았습니다(전체 ${comment.replies.totalCount}건).`);
  }
  return [
    toAnswer(questionNumber, comment, null),
    ...comment.replies.nodes.map((reply) => toAnswer(questionNumber, reply, comment.id)),
  ];
}

function toAnswer(questionNumber: number, raw: RawReply, parentId: string | null): Answer {
  return {
    id: raw.id,
    questionNumber,
    author: raw.author?.login ?? null,
    body: raw.body,
    bodyHtml: sanitizeBodyHtml(raw.bodyHTML),
    bodyText: raw.bodyText,
    createdAt: raw.createdAt,
    parentId,
  };
}
