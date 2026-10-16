// Only same-site relative paths — otherwise "?next=https://evil.com" becomes an open redirect.
export function safeNextPath(next: string | null | undefined) {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/";
  return next;
}
