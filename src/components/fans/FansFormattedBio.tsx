"use client";
import type { ReactNode } from "react";
function renderFormatted(text: string, keyPrefix = "root"): ReactNode[] {
 const output: ReactNode[] = []; let cursor = 0; let tokenIndex = 0;
 const token = /\*\*|\[cor=(#[0-9a-fA-F]{6})\]/g; let match: RegExpExecArray | null;
 while ((match = token.exec(text)) !== null) {
  if (match.index > cursor) output.push(text.slice(cursor, match.index));
  const key = keyPrefix + "-" + match.index + "-" + tokenIndex++;
  if (match[0] === "**") { const end = text.indexOf("**", token.lastIndex); if (end < 0) { output.push("**"); cursor = token.lastIndex; token.lastIndex = cursor; continue; } output.push(<strong key={key} className="font-extrabold text-inherit">{renderFormatted(text.slice(token.lastIndex, end), key)}</strong>); cursor = end + 2; token.lastIndex = cursor; }
  else { const end = text.indexOf("[/cor]", token.lastIndex); if (end < 0) { output.push(match[0]); cursor = token.lastIndex; continue; } output.push(<span key={key} style={{ color: match[1] }}>{renderFormatted(text.slice(token.lastIndex, end), key)}</span>); cursor = end + 6; token.lastIndex = cursor; }
 }
 if (cursor < text.length) output.push(text.slice(cursor)); return output;
}
export default function FansFormattedBio({ text }: { text: string }) { return <span style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{renderFormatted(text)}</span>; }
