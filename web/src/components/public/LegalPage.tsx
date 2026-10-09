import Link from "next/link";
import { Info } from "lucide-react";
import { LEGAL, LEGAL_VERSION } from "./legal";
import { Markdown, headings, slugify } from "./markdown";

const TABS: [string, string][] = [["cgu", "Conditions générales d'utilisation"], ["confidentialite", "Politique de confidentialité"], ["mentions-legales", "Mentions légales"], ["cookies", "Cookies"]];

/** Gabarit commun des pages légales (maquette 49). */
export function LegalPage({ page }: { page: keyof typeof LEGAL }) {
  const L = LEGAL[page];
  const toc = headings(L.body);
  return (
    <div className="container flex flex-col gap-8 pt-8">
      <nav className="flex flex-wrap gap-2" aria-label="Pages légales">{TABS.map(([k, t]) => <Link key={k} href={`/${k}`} className={`chip px-4 py-2 text-[13px] ${k === page ? "bg-ink text-white" : "border border-slate-200 bg-white text-ink-soft hover:border-brand-300"}`}>{t}</Link>)}</nav>
      <div className="grid items-start gap-10 lg:grid-cols-[260px_1fr]">
        <aside className="card hidden flex-col gap-1 rounded-[22px] p-5 lg:sticky lg:top-24 lg:flex"><span className="mb-1 text-xs font-extrabold uppercase text-ink-mute">Sommaire</span>{toc.map((t, i) => <a key={t} href={`#${slugify(t)}`} className="rounded-lg px-2 py-1.5 text-sm hover:bg-brand-50">{i + 1}. {t}</a>)}</aside>
        <article className="flex max-w-3xl flex-col gap-5">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-[44px]">{L.title}</h1>
          <div className="flex flex-wrap gap-2"><span className="chip bg-[#eef1f8] text-ink-soft">Version {LEGAL_VERSION.version}</span><span className="chip bg-brand-50 text-brand-700">En vigueur au {LEGAL_VERSION.date}</span><span className="chip bg-sun-100 text-[#a55a00]">Gabon · Maroc · Sénégal</span></div>
          <p className="flex items-start gap-2.5 rounded-2xl bg-brand-50 p-4 text-sm text-brand-800"><Info size={18} className="shrink-0" /><span><b>En bref : </b>{L.brief}</span></p>
          <Markdown text={L.body} />
        </article>
      </div>
    </div>
  );
}
