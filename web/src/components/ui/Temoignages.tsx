import Link from "@/components/ui/Link";
import { ArrowRight, Briefcase, CirclePlay, ExternalLink, Library, Mic, Newspaper, Quote, Radio, ShieldCheck } from "lucide-react";
import { domStyle } from "@/components/ui/Cards";
import { metierById } from "@/lib/data";
import { dateTemoignage, initiales, temoignagesDuDomaine, temoignagesDuMetier, type Temoignage } from "@/lib/temoignages";

const TYPE = { article: [Newspaper, "Article", "Lire le témoignage"], video: [CirclePlay, "Vidéo", "Voir la vidéo"], radio: [Radio, "Radio", "Écouter"], podcast: [Mic, "Podcast", "Écouter"] } as const;
const couleur = (t: Temoignage) => domStyle(metierById[t.metier]?.domaine ?? "").solid;

function Avatar({ t, size }: { t: Temoignage; size: number }) {
  return <span aria-hidden className="flex shrink-0 items-center justify-center font-extrabold text-white" style={{ width: size, height: size, borderRadius: size / 3, background: couleur(t), fontSize: size / 2.6 }}>{initiales(t.personne)}</span>;
}

/** Carte « Ils racontent leur métier » (maquettes « temoignages ») : citation exacte, résumé Navigoal, source et lien. */
export function TemoignageCarte({ t, grand = false, lienMetier = false }: { t: Temoignage; grand?: boolean; lienMetier?: boolean }) {
  const [Icon, type, lien] = TYPE[t.type];
  const date = dateTemoignage(t.date);
  return (
    <article className={`card flex h-full flex-col gap-3.5 rounded-[20px] ${grand ? "p-5 sm:p-6" : "p-5"}`}>
      <div className="flex items-center gap-3">
        <Avatar t={t} size={grand ? 56 : 46} />
        <div className="min-w-0 flex-1"><b className={grand ? "text-[17px]" : "text-[15px]"}>{t.personne}</b><p className="text-xs text-ink-mute">{t.role} · {t.lieu}</p></div>
        <span className="chip shrink-0 bg-brand-50 text-[11px] text-brand-700"><Icon size={12} />{type}</span>
      </div>
      {t.citation && (
        <blockquote className={`relative rounded-r-[14px] border-l-4 border-sun-400 bg-[#fffbea] ${grand ? "px-4 py-3.5" : "px-3.5 py-3"}`}>
          <Quote aria-hidden size={18} className="absolute -top-2.5 left-2 fill-sun-400 text-sun-400" />
          <p className={`font-bold italic leading-snug ${grand ? "text-base sm:text-lg" : "text-[14.5px]"}`}>« {t.citation} »</p>
        </blockquote>
      )}
      <p className={`leading-relaxed text-ink-soft ${grand ? "text-[15px]" : "text-[13.5px]"}`}>{t.resume}</p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2.5 border-t border-[#eef1f8] pt-3">
        <span className="text-xs text-ink-mute">Source : <b className="text-ink-soft">{t.media}</b>{date && ` · ${date}`}</span>
        <a href={t.url} target="_blank" rel="noopener noreferrer" className="btn-ghost px-3 py-1.5 text-[12.5px]">{lien}<ExternalLink size={13} /></a>
      </div>
      {lienMetier && metierById[t.metier] && <Link href={`/metiers/${t.metier}/`} className="flex items-center gap-1.5 text-xs font-extrabold text-brand-600 hover:underline"><Briefcase size={12} />Fiche métier : {metierById[t.metier].nom}<ArrowRight size={12} /></Link>}
    </article>
  );
}

function Mini({ t }: { t: Temoignage }) {
  return (
    <Link href={`/metiers/${t.metier}/`} className="card flex items-center gap-3 rounded-[18px] p-3.5 transition hover:shadow-lift">
      <Avatar t={t} size={42} />
      <span className="min-w-0 flex-1"><b className="block text-sm">{t.personne}</b><span className="block text-xs text-ink-mute">{metierById[t.metier]?.nom ?? t.role}</span>
        {t.citation && <span className="mt-1 block truncate text-xs italic text-ink-soft">« {t.citation} »</span>}</span>
      <ArrowRight size={16} className="shrink-0 text-brand-600" />
    </Link>
  );
}

export const AVERTISSEMENT = "Témoignages publics vérifiés sur leur source, résumés par Navigoal. Vous êtes l'une de ces personnes ? Écrivez-nous pour corriger ou retirer votre témoignage.";

/** Encart de la fiche métier : témoignages du métier, puis d'autres professionnels du domaine. */
export function TemoignagesMetier({ metier }: { metier: string }) {
  const propres = temoignagesDuMetier(metier);
  const autres = temoignagesDuDomaine(metier, propres.length ? 2 : 3);
  if (!propres.length && !autres.length) return null;
  return (
    <section className="container mt-10 flex flex-col gap-4">
      <div><span className="chip bg-sun-100 text-[11px] text-[#a55a00]"><Quote size={12} />TÉMOIGNAGE</span>
        <h2 className="mt-2.5 text-[28px] font-extrabold tracking-tight">{propres.length ? "Ils racontent leur métier" : "Des professionnels du domaine racontent"}</h2>
        <p className="mt-1 text-ink-mute">Des professionnels parlent de leur quotidien. Résumé par Navigoal, avec un lien vers le témoignage original.</p></div>
      <div className={`grid grid-cols-1 items-start gap-5 ${propres.length ? "lg:grid-cols-[1.35fr_1fr]" : ""}`}>
        {propres.length > 0 && (
          <div className="-mx-4 flex min-w-0 snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
            {propres.map((t) => <div key={t.id} className={`shrink-0 snap-start lg:w-auto ${propres.length > 1 ? "w-[86%] sm:w-[70%]" : "w-full"}`}><TemoignageCarte t={t} grand /></div>)}
          </div>
        )}
        <div className="flex min-w-0 flex-col gap-3">
          {autres.length > 0 && <p className="text-xs font-extrabold uppercase tracking-wide text-ink-mute">{propres.length ? "D'autres professionnels du domaine racontent" : "Dans des métiers proches"}</p>}
          <div className={propres.length ? "flex flex-col gap-3" : "grid grid-cols-1 gap-3 md:grid-cols-3"}>{autres.map((t) => <Mini key={t.id} t={t} />)}</div>
          <Link href="/temoignages/" className="btn-ghost self-start"><Library size={16} />Tous les témoignages</Link>
          <p className="flex gap-2 rounded-2xl bg-[#f6f8fe] p-3.5 text-xs leading-relaxed text-ink-mute"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#0f8a46]" /><span>{AVERTISSEMENT} <a href="mailto:contact@navigoal.net?subject=T%C3%A9moignage" className="font-bold text-brand-600">contact@navigoal.net</a></span></p>
        </div>
      </div>
    </section>
  );
}
