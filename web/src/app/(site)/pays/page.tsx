import type { Metadata } from "next";
import Link from "@/components/ui/Link";
import { ArrowRight, ChevronRight, ShieldCheck } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { Drapeau } from "@/components/ui/Drapeau";
import { DESTINATIONS_ACTIVES, DESTINATIONS_BIENTOT, LABELS, PAYS_ACTIFS_TEXTE, paysDetailById } from "@/lib/data";

export const metadata: Metadata = {
  title: "Pays de destination : où étudier en Afrique ?",
  description: `Étudier ${PAYS_ACTIFS_TEXTE} : écoles privées reconnues par l'État, labels officiels de chaque pays, visa, budget et villes étudiantes.`,
  alternates: { canonical: "/pays/" },
};

/** Pays de destination (maquettes « destinations », écrans 1 et 5) : pays ouverts, pays à venir et sens des labels dans chaque pays. */
export default function PaysPage() {
  const [n1, n2] = LABELS;
  return (
    <>
      <section className="relative overflow-hidden bg-[radial-gradient(900px_400px_at_85%_0%,#dae6ff,transparent_60%),radial-gradient(600px_300px_at_0%_100%,#fff3c4,transparent_60%)] pb-10 pt-8">
        <div className="container flex flex-col gap-4">
          <nav className="flex items-center gap-1.5 text-[13px] text-ink-mute" aria-label="Fil d'Ariane"><Link href="/">Accueil</Link><ChevronRight size={14} /><span>Pays</span></nav>
          <h1 className="h-display">Où veux-tu <span className="text-sun-500">étudier</span> ?</h1>
          <p className="max-w-2xl text-lg text-ink-soft">Navigoal ne présente que des écoles privées reconnues par l&apos;État du pays (ou inter-États). Choisis ta destination : visa, budget, villes et écoles.</p>
        </div>
      </section>
      <div className="container flex flex-col gap-12">
        <Stagger className="grid gap-5 md:grid-cols-2">
          {DESTINATIONS_ACTIVES.map((d) => {
            const P = paysDetailById[d.code];
            return (
              <StaggerItem key={d.code}>
                <Link href={`/pays/${d.code.toLowerCase()}/`} className="card group flex h-full flex-col gap-4 rounded-3xl p-6 transition hover:-translate-y-1 hover:shadow-lift">
                  <div className="flex items-center gap-4"><Drapeau code={d.code} taille={38} /><div><b className="text-2xl font-extrabold">{d.nom}</b><p className="text-[13px] text-ink-mute">{d.villes.slice(0, 4).map((v) => v.nom).join(" · ")}</p></div></div>
                  {P && <p className="text-[15px] leading-relaxed text-ink-soft">{P.accroche}</p>}
                  <div className="flex flex-wrap gap-2">
                    <span className="chip bg-brand-50 text-brand-700">{d.etablissements} établissements</span>
                    {[d.labels.reconnu_etat?.libelle, d.labels.diplomes_homologues?.libelle].filter(Boolean).map((l) => <span key={l} className="chip bg-[#e8f8ef] text-[#0f8a46]"><ShieldCheck size={12} />{l}</span>)}
                  </div>
                  <span className="mt-auto flex items-center gap-1.5 text-sm font-bold text-brand-600">Étudier {d.prep} <ArrowRight size={15} className="transition group-hover:translate-x-1" /></span>
                </Link>
              </StaggerItem>
            );
          })}
        </Stagger>

        {DESTINATIONS_BIENTOT.length > 0 && (
          <section className="flex flex-col gap-3">
            <span className="eyebrow">Prochaines destinations</span>
            <div className="flex flex-wrap gap-2">{DESTINATIONS_BIENTOT.map((d) => <span key={d.code} className="chip border border-dashed border-[#c9d2e6] bg-white px-3.5 py-2 text-sm text-ink-soft"><Drapeau code={d.code} taille={14} />{d.nom} · bientôt</span>)}</div>
            <p className="text-sm text-ink-mute">Ces pays s&apos;ouvriront quand la liste officielle de leurs écoles privées reconnues aura été vérifiée.</p>
          </section>
        )}

        <Reveal className="flex flex-col gap-4">
          <div><span className="eyebrow">Labels Navigoal</span><h2 className="h-section mt-2">Deux niveaux de reconnaissance, adaptés à chaque pays</h2>
            <p className="mt-1 text-ink-mute">Niveau 1 : l&apos;établissement lui-même est reconnu. Niveau 2 : certains de ses programmes le sont. Les écoles inter-États sont signalées à part.</p></div>
          <div className="card overflow-x-auto rounded-[22px] p-2">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead><tr className="text-xs uppercase tracking-wide text-ink-mute"><th className="p-3">Pays</th><th className="p-3">Niveau 1</th><th className="p-3">Ce que ça veut dire</th><th className="p-3">Niveau 2</th><th className="p-3">Ce que ça veut dire</th></tr></thead>
              <tbody>
                {DESTINATIONS_ACTIVES.map((d) => (
                  <tr key={d.code} className="border-t border-[#eef1f8] align-top">
                    <td className="p-3"><span className="flex items-center gap-2 font-bold"><Drapeau code={d.code} taille={13} />{d.nom}</span></td>
                    <td className="p-3"><span className="chip bg-[#e8f8ef] text-[#0f8a46]">{d.labels.reconnu_etat?.libelle ?? n1.libelle}</span></td>
                    <td className="p-3 text-ink-soft">{d.labels.reconnu_etat?.description ?? n1.description}</td>
                    <td className="p-3"><span className="chip bg-brand-50 text-brand-700">{d.labels.diplomes_homologues?.libelle ?? n2.libelle}</span></td>
                    <td className="p-3 text-ink-soft">{d.labels.diplomes_homologues?.description ?? n2.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-ink-mute">Les filtres « Label » restent les mêmes partout ; seul le libellé change selon le pays.</p>
        </Reveal>
      </div>
    </>
  );
}
