export type NavItemVM = {
  readonly label: string;
  readonly href: string;
  readonly countText: string;
  readonly countLabel: string;
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
