export type NavItemVM = {
  readonly label: string;
  readonly href: string;
  readonly countText?: string;
  readonly countLabel?: string;
  readonly avatarUrl?: string | null;
};

export type QuestionItemVM = {
  readonly number: number;
  readonly text: string;
  readonly href: string;
  readonly categoryLabel: string;
  readonly categoryHref: string;
  readonly dateText: string;
  readonly dateTime: string;
  readonly statusLabel: "마감" | "진행 중";
  readonly answerCountText: string;
};

export type ShellVM = {
  readonly categories: readonly NavItemVM[];
  readonly authors: readonly NavItemVM[];
  readonly discussionsUrl: string;
  readonly repositoryUrl: string;
};

export type HomeVM = {
  readonly categories: readonly NavItemVM[];
  readonly recentQuestions: readonly QuestionItemVM[];
};

export type CategoryPageVM = {
  readonly title: string;
  readonly countText: string;
  readonly questions: readonly QuestionItemVM[];
};

export type AnswerVM = {
  readonly id: string;
  readonly authorLabel: string;
  readonly authorDeleted: boolean;
  readonly authorHref: string | null;
  readonly authorAvatarUrl: string | null;
  readonly dateText: string;
  readonly dateTime: string;
  readonly bodyHtml: string;
  readonly isNew?: boolean;
  readonly isEdited?: boolean;
};

export type ThreadVM = {
  readonly answer: AnswerVM;
  readonly replies: readonly AnswerVM[];
};

export type QuestionDetailVM = {
  readonly number: number;
  readonly text: string;
  readonly note: string | null;
  readonly categoryLabel: string;
  readonly categoryHref: string;
  readonly dateText: string;
  readonly dateTime: string;
  readonly statusLabel: "마감" | "진행 중";
  readonly discussionUrl: string;
  readonly pollUrl: string;
  readonly threads: readonly ThreadVM[];
};

export type AuthorAnswerVM = {
  readonly id: string;
  readonly questionText: string;
  readonly questionHref: string;
  readonly categoryLabel: string;
  readonly categoryHref: string;
  readonly dateText: string;
  readonly dateTime: string;
  readonly bodyHtml: string;
};

export type AuthorPageVM = {
  readonly login: string;
  readonly avatarUrl: string | null;
  readonly profileUrl: string;
  readonly answers: readonly AuthorAnswerVM[];
};

export type SearchExcerptVM = {
  readonly label: string;
  readonly segments: readonly { readonly text: string; readonly match: boolean }[];
};

export type SearchResultVM = {
  readonly number: number;
  readonly titleSegments: readonly { readonly text: string; readonly match: boolean }[];
  readonly href: string;
  readonly categoryLabel: string;
  readonly categoryHref: string;
  readonly dateText: string;
  readonly dateTime: string;
  readonly excerpts: readonly SearchExcerptVM[];
};

export type SearchPageVM = {
  readonly query: string;
  readonly summary: string | null;
  readonly results: readonly SearchResultVM[];
  readonly categories: readonly NavItemVM[];
};
