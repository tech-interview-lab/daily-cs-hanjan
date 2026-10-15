const PREFIX = /^\[([^\]]+)\]/;

export function extractCategory(title: string): string | null {
  const match = PREFIX.exec(title);
  return match?.[1]?.trim() || null;
}
