export type SearchDocument = {
  readonly questionNumber: number;
  readonly field: "question" | "answer";
  readonly author: string | null;
  readonly text: string;
};

export type ExcerptSegment = { readonly text: string; readonly match: boolean };

export type SearchHit = {
  readonly document: SearchDocument;
  readonly matchCount: number;
  readonly excerpt: readonly ExcerptSegment[];
};

export interface SearchIndex {
  search(documents: readonly SearchDocument[], query: string): SearchHit[];
}
