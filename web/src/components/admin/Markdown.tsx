"use client";
import { Fragment, type ReactNode } from "react";

/** Rendu Markdown minimal et sûr (titres, listes, gras, italique, liens, citations) — sans HTML brut. */
function inline(s: string, key = 0): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(\[([^\]]+)\]\(([^)\s]+)\))/g;
  let last = 0, m: RegExpExecArray | null, i = 0;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index));
    const k = `${key}-${i++}`;
    if (m[2]) out.push(<strong key={k}>{inline(m[2], i)}</strong>);
    else if (m[4]) out.push(<em key={k}>{inline(m[4], i)}</em>);
    else if (m[6]) {
      const href = /^(https?:\/\/|\/|#|mailto:)/.test(m[7]) ? m[7] : "#";
      out.push(<a key={k} href={href} className="font-semibold text-brand-600 underline" target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">{m[6]}</a>);
    }
    last = re.lastIndex;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}

export function Markdown({ text, className = "" }: { text: string; className?: string }) {
  const blocks: ReactNode[] = [];
  const lines = text.replace(/\r/g, "").split("\n");
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    const h = /^(#{1,4})\s+(.*)$/.exec(l);
    if (h) {
      const lvl = h[1].length;
      blocks.push(lvl <= 2 ? <h2 key={i} className="mt-2 text-lg font-extrabold">{inline(h[2])}</h2> : <h3 key={i} className="mt-1 font-extrabold">{inline(h[2])}</h3>);
      i++; continue;
    }
    if (/^\s*([-*]|\d+\.)\s+/.test(l)) {
      const ordered = /^\s*\d+\./.test(l);
      const items: string[] = [];
      while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*([-*]|\d+\.)\s+/, "")); i++; }
      const Tag = ordered ? "ol" : "ul";
      blocks.push(<Tag key={i} className={`flex flex-col gap-1 pl-5 ${ordered ? "list-decimal" : "list-disc"}`}>{items.map((t, k) => <li key={k}>{inline(t)}</li>)}</Tag>);
      continue;
    }
    if (l.startsWith(">")) {
      const q: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) { q.push(lines[i].replace(/^>\s?/, "")); i++; }
      blocks.push(<blockquote key={i} className="border-l-4 border-brand-200 pl-3 italic text-ink-soft">{inline(q.join(" "))}</blockquote>);
      continue;
    }
    const p: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|>|\s*([-*]|\d+\.)\s)/.test(lines[i])) { p.push(lines[i]); i++; }
    blocks.push(<p key={i}>{p.map((t, k) => <Fragment key={k}>{k > 0 && <br />}{inline(t)}</Fragment>)}</p>);
  }
  return <div className={`flex flex-col gap-3 text-sm leading-relaxed text-ink-soft ${className}`}>{blocks}</div>;
}
