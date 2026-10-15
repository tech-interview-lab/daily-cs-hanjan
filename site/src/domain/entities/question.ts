export type Question = {
  readonly number: number;
  readonly title: string;
  readonly text: string;
  readonly category: string;
  readonly createdAt: string;
  readonly closed: boolean;
  readonly url: string;
  readonly bodyHtml: string;
};
