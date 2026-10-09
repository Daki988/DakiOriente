import { Fragment, type ReactNode } from "react";

// Rendu Markdown minimal et sûr (titres, listes, gras, italique, liens internes/externes) sans HTML brut.
const inline = (s: string): ReactNode[] => s.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g).map((t, i) => {
  if (t.startsWith("**")) return <strong key={i}>{t.slice(2, -2)}</strong>;
  if (/^\*[^*]/.test(t)) return <em key={i}>{t.slice(1, -1)}</em>;
  const m = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(t);
  if (m && /^(\/|https?:\/\/)/.test(m[2])) return <a key={i} href={m[2]} className="font-semibold text-brand-600 underline" {...(m[2].startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{m[1]}</a>;
  return <Fragment key={i}>{t}</Fragment>;
});
export const slugify = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const headings = (md: string) => md.split("\n").filter((l) => /^##\s/.test(l)).map((l) => l.replace(/^##\s+/, ""));

export function Markdown({ text }: { text: string }) {
  const blocks = text.replace(/\r/g, "").split(/\n{2,}/);
  return (
    <div className="flex flex-col gap-4 text-[16px] leading-relaxed text-ink-soft">
      {blocks.map((b, i) => {
        const lines = b.split("\n");
        if (/^###\s/.test(b)) return <h3 key={i} className="mt-2 text-lg font-extrabold text-ink">{inline(b.replace(/^###\s+/, ""))}</h3>;
        if (/^##\s/.test(b)) { const t = b.replace(/^##\s+/, ""); return <h2 key={i} id={slugify(t)} className="mt-4 scroll-mt-28 text-2xl font-extrabold text-ink">{inline(t)}</h2>; }
        if (lines.every((l) => /^[-*]\s/.test(l))) return <ul key={i} className="flex list-disc flex-col gap-1.5 pl-6">{lines.map((l, k) => <li key={k}>{inline(l.replace(/^[-*]\s+/, ""))}</li>)}</ul>;
        if (lines.every((l) => /^\d+\.\s/.test(l))) return <ol key={i} className="flex list-decimal flex-col gap-1.5 pl-6">{lines.map((l, k) => <li key={k}>{inline(l.replace(/^\d+\.\s+/, ""))}</li>)}</ol>;
        if (/^>\s/.test(b)) return <blockquote key={i} className="rounded-2xl border border-[#f6dd9a] bg-[#fff7dd] p-4 text-[15px] text-[#6b3d00]">{inline(b.replace(/^>\s?/gm, ""))}</blockquote>;
        return <p key={i}>{lines.map((l, k) => <Fragment key={k}>{k > 0 && <br />}{inline(l)}</Fragment>)}</p>;
      })}
    </div>
  );
}
