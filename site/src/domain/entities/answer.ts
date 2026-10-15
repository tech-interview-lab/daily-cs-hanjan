export type Answer = {
  readonly id: string;
  readonly questionNumber: number;
  readonly author: string | null;
  readonly authorAvatarUrl: string | null;
  readonly body: string;
  readonly bodyHtml: string;
  readonly bodyText: string;
  readonly createdAt: string;
  readonly parentId: string | null;
};
