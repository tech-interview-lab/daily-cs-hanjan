const QUESTION_LINE = /\*\*\[[^\]]+\]\*\*\s*(.+?)\r?\n\r?\n---/s;

export function extractQuestionText(body: string): string | null {
  const text = QUESTION_LINE.exec(body)?.[1]?.trim();
  return text || null;
}

const NOTE_LINE = /^>\s?(.+)$/gm;

export function extractQuestionNote(body: string): string | null {
  const lines = [...body.matchAll(NOTE_LINE)].map((match) => match[1]?.trim() ?? "").filter(Boolean);
  return lines.length ? lines.join(" ") : null;
}
