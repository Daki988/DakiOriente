import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, CheckCircle2, ChevronRight, ExternalLink, FileText, Info, ShieldCheck } from "lucide-react";
import Link from "@/components/ui/Link";
import { SuivreBourse } from "@/components/ui/SuivreBourse";
import { BOURSES, bourseById, paysEtudesLibelle, paysOrigineLibelle } from "@/lib/bourses";
import { etabById } from "@/lib/data";
import { filAriane } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

export const generateStaticParams = () => BOURSES.map((b) => ({ id: b.id }));
export const dynamicParams = false;
export const generateMetadata = async (props: { params: Promise<{ id: string }> }): Promise<Metadata> => {
  const b = bourseById[(await props.params).id];
  if (!b) return {};
  return { title: `${b.nom} : conditions, pièces et démarche`, description: `${b.organisme}. ${b.pour}`.slice(0, 158), alternates: { canonical: `/bourses/${b.id}/` } };
};
const dateLongue = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export default async function BoursePage(props: { params: Promise<{ id: string }> }) {
  const b = bourseById[(await props.params).id];
  if (!b) notFound();
  const Bloc = ({ titre, children }: { titre: string; children: React.ReactNode }) => <section className="card flex flex-col gap-3 rounded-[22px] p-5"><h2 className="text-xl font-extrabold">{titre}</h2>{children}</section>;
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(filAriane(SITE_URL, [["Bourses", "/bourses/"], [b.nom, `/bourses/${b.id}/`]])).replace(/</g, "\\u003c") }} />
      <section className="bg-gradient-to-br from-[#e8f8ef] to-[#f6f8fe] pb-8 pt-10">
        <div className="container flex flex-col gap-3">
          <nav className="flex flex-wrap items-center gap-1.5 text-[13px] text-ink-mute"><Link href="/">Accueil</Link><ChevronRight size={14} /><Link href="/bourses/">Bourses</Link><ChevronRight size={14} /><span>{b.nom}</span></nav>
          <span className="text-sm font-bold uppercase tracking-wide text-brand-600">{b.organisme}</span>
          <h1 className="h-section">{b.nom}</h1>
          <p className="max-w-3xl text-lg text-ink-soft">{b.pour}</p>
          <div className="flex flex-wrap items-center gap-3"><SuivreBourse id={b.id} /><span className="text-xs text-ink-mute">Vérifiée le {dateLongue(b.verifie_le)} sur les sources officielles</span></div>
        </div>
      </section>
      <div className="container mt-8 grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-5">
          <Bloc titre="Conditions"><ul className="flex flex-col gap-2">{b.conditions.map((c) => <li key={c} className="flex gap-2 text-[15px]"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#0b7a3d]" />{c}</li>)}</ul></Bloc>
          {b.couverture && <Bloc titre="Ce que couvre la bourse"><p className="text-[15px] text-ink-soft">{b.montant ? <b className="text-ink">{b.montant}. </b> : null}{b.couverture}</p></Bloc>}
          {!!b.pieces.length && <Bloc titre="Pièces à préparer"><ul className="flex flex-col gap-2">{b.pieces.map((c) => <li key={c} className="flex gap-2 text-[15px]"><FileText size={17} className="mt-0.5 shrink-0 text-brand-600" />{c}</li>)}</ul><p className="text-sm text-ink-mute">Les pièces déjà déposées dans <Link href="/espace/documents/" className="font-bold text-brand-600">Mes documents</Link> pour tes candidatures te serviront aussi.</p></Bloc>}
          <Bloc titre="Démarche"><p className="text-[15px] text-ink-soft">{b.demarche}</p></Bloc>
          {b.ecoles_privees_maroc && <Bloc titre="Et pour une école privée ?"><p className="flex gap-2 text-[15px] text-ink-soft"><Info size={18} className="mt-0.5 shrink-0 text-[#a55a00]" />{b.ecoles_privees_maroc}</p>
            {!!b.ecoles_partenaires.length && <p className="text-sm">Procédure dédiée connue : {b.ecoles_partenaires.filter((e) => etabById[e]).map((e, i) => <span key={e}>{i ? ", " : ""}<Link href={`/etablissements/${e}/`} className="font-bold text-brand-600">{etabById[e].sigle || etabById[e].nom}</Link></span>)}</p>}</Bloc>}
        </div>
        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card flex flex-col gap-3 rounded-[22px] p-5 text-sm">
            <span><b className="block text-ink">Pour qui</b>{paysOrigineLibelle(b)}</span>
            <span><b className="block text-ink">Pays d&apos;études</b>{paysEtudesLibelle(b)}</span>
            <span><b className="block text-ink">Établissements</b>{b.criteres.type_etablissement === "public" ? "Publics seulement" : "Publics et privés, selon l'organisme"}</span>
            {b.calendrier && <span className="flex gap-2"><CalendarDays size={16} className="mt-0.5 shrink-0 text-brand-600" /><span><b className="block text-ink">Calendrier</b>{b.calendrier}{b.date_limite ? ` Date limite : ${dateLongue(b.date_limite)}.` : ""}</span></span>}
          </div>
          <div className="card flex flex-col gap-2 rounded-[22px] p-5"><b>Liens officiels</b>{b.liens.map((l) => <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline"><ExternalLink size={14} />{l.libelle}</a>)}</div>
          <p className="flex gap-2 rounded-2xl bg-[#f6f8fe] p-4 text-xs text-ink-mute"><ShieldCheck size={16} className="shrink-0 text-[#0b7a3d]" />Décision de l&apos;organisme : Navigoal informe et accompagne, mais n&apos;attribue aucune bourse et ne la promet jamais.</p>
        </aside>
      </div>
    </>
  );
}
