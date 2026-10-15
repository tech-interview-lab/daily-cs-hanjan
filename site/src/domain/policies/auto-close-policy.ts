const MARKER = "<!-- hanjan:auto-close -->";
const LEGACY_PREFIXES = ["🔒 다음 질문이 올라와서", "⏰ **다음 질문이 올라와"];

export function isAutoCloseComment(body: string): boolean {
  if (body.includes(MARKER)) return true;
  return LEGACY_PREFIXES.some((prefix) => body.startsWith(prefix));
}
