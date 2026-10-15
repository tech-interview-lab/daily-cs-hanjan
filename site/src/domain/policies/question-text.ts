const QUESTION_LINE = /\*\*\[[^\]]+\]\*\*\s*(.+?)\r?\n\r?\n---/s;

export function extractQuestionText(body: string): string | null {
  const text = QUESTION_LINE.exec(body)?.[1]?.trim();
  return text || null;
}
