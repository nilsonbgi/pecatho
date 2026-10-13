"use client";
import type { ReactNode } from "react";
export default function FansFormattedBio({ text }: { text: string }) {
 const pattern = /\*\*([^*]+)\*\*|\[cor=(#[0-9a-fA-F]{6})\]([\s\S]*?)\[\/cor\]/g;
 const output: ReactNode[] = []; let cursor = 0; let match: RegExpExecArray | null;
 while ((match = pattern.exec(text)) !== null) { if (match.index > cursor) output.push(text.slice(cursor, match.index)); if (match[1] !== undefined) output.push(<strong key={match.index} className="font-extrabold text-inherit">{match[1]}</strong>); else if (match[2] && match[3] !== undefined) output.push(<span key={match.index} style={{ color: match[2] }}>{match[3]}</span>); cursor = pattern.lastIndex; }
 if (cursor < text.length) output.push(text.slice(cursor));
 return <span style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{output}</span>;
}
