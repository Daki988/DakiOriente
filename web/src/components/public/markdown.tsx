import { Fragment, type ReactNode } from "react";

// Rendu Markdown minimal et sûr (titres, listes, gras, italique, liens internes/externes) sans HTML brut.
const inline = (s: string): ReactNode[] => s.split(/(\[à compléter : [^\]]+\]|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g).map((t, i) => {
  if (t.startsWith("[à compléter")) return <mark key={i} className="rounded-md border border-dashed border-[#d4a300] bg-[#fff1a8] px-1.5 py-0.5 text-[.92em] font-bold text-[#7a5a00]">{t.slice(1, -1)}</mark>;
  if (t.startsWith("**")) return <strong key={i} className="font-bold text-ink">{t.slice(2, -2)}</strong>;
  if (/^\*[^*]/.test(t)) return <em key={i}>{t.slice(1, -1)}</em>;
  const m = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(t);
  if (m && /^(\/|https?:\/\/)/.test(m[2])) return <a key={i} href={m[2]} className="font-semibold text-brand-600 underline" {...(m[2].startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{m[1]}</a>;
  return <Fragment key={i}>{t}</Fragment>;
});
export const slugify = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const headings = (md: string) => md.split("\n").filter((l) => /^##\s/.test(l)).map((l) => l.replace(/^##\s+/, ""));

/** `numeros` : titres de section numérotés dans une pastille de la couleur `couleur` (pages légales). */
export function Markdown({ text, numeros, couleur = "#1a47f5" }: { text: string; numeros?: boolean; couleur?: string }) {
  const blocks = text.replace(/\r/g, "").split(/\n{2,}/);
  let n = 0;
  return (
    <div className="flex flex-col gap-4 text-[16px] leading-relaxed text-ink-soft">
      {blocks.map((b, i) => {
        const lines = b.split("\n");
        if (/^###\s/.test(b)) return <h3 key={i} className="mt-2 text-lg font-extrabold text-ink">{inline(b.replace(/^###\s+/, ""))}</h3>;
        if (/^##\s/.test(b)) {
          const t = b.replace(/^##\s+/, ""); n++;
          return <h2 key={i} id={slugify(t)} className="mt-6 flex scroll-mt-32 items-center gap-3 text-2xl font-extrabold tracking-tight text-ink">{numeros && <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-sm text-white" style={{ background: couleur }}>{n}</span>}{inline(t)}</h2>;
        }
        if (lines.every((l) => l.startsWith("|"))) {
          const rows = lines.filter((l) => !/^\|[-|\s:]+\|$/.test(l)).map((l) => l.replace(/^\||\|$/g, "").split("|").map((c) => c.trim()));
          return (
            <div key={i} className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full min-w-[480px] border-collapse text-[14.5px]">
                <thead><tr>{rows[0].map((c, k) => <th key={k} className="bg-[#f6f8fe] px-4 py-2.5 text-left text-xs font-extrabold uppercase tracking-wide text-ink-soft">{inline(c)}</th>)}</tr></thead>
                <tbody>{rows.slice(1).map((r, k) => <tr key={k} className="border-t border-slate-100">{r.map((c, j) => <td key={j} className="px-4 py-2.5 align-top leading-snug">{inline(c)}</td>)}</tr>)}</tbody>
              </table>
            </div>
          );
        }
        if (lines.every((l) => /^[-*]\s/.test(l))) return <ul key={i} className="flex list-disc flex-col gap-1.5 pl-6">{lines.map((l, k) => <li key={k}>{inline(l.replace(/^[-*]\s+/, ""))}</li>)}</ul>;
        if (lines.every((l) => /^\d+\.\s/.test(l))) return <ol key={i} className="flex list-decimal flex-col gap-1.5 pl-6">{lines.map((l, k) => <li key={k}>{inline(l.replace(/^\d+\.\s+/, ""))}</li>)}</ol>;
        if (/^>\s/.test(b)) return <blockquote key={i} className="rounded-2xl border border-[#f6dd9a] bg-[#fff7dd] p-4 text-[15px] text-[#6b3d00]">{inline(b.replace(/^>\s?/gm, ""))}</blockquote>;
        return <p key={i}>{lines.map((l, k) => <Fragment key={k}>{k > 0 && <br />}{inline(l)}</Fragment>)}</p>;
      })}
    </div>
  );
}
