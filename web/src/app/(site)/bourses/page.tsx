import type { Metadata } from "next";
import { ChevronRight, ShieldCheck } from "lucide-react";
import Link from "@/components/ui/Link";
import { BoursesListe } from "@/components/sections/BoursesListe";
import { BoursesEcoles } from "@/components/sections/BoursesEcoles";
import { boursesDesEcoles } from "@/server/bourses-ecoles";
import { BOURSES } from "@/lib/bourses";
import { photo } from "@/lib/photos";
import { variantes } from "@/lib/couvertures";
import { listCampaigns } from "@/server/services/establishments";
import { etabById } from "@/lib/data";
import { filAriane } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Bourses d'études à l'étranger : conditions, démarches",
  description: "Bourses d'excellence, sociales et réductions des écoles, bourses publiques des pays d'origine : conditions, montants et démarches, relevés sur les sites officiels.",
  alternates: { canonical: "/bourses/" },
};

export default async function BoursesPage() {
  const campagnes = (await listCampaigns({ publishedOnly: true, current: true }).catch(() => []))
    .filter((c) => c.kind === "bourse" && etabById[c.establishmentId])
    .map((c) => ({ id: c.id, eid: c.establishmentId, ecole: etabById[c.establishmentId].sigle || etabById[c.establishmentId].nom, titre: c.title, fin: c.endsAt.toISOString(), conditions: c.conditions }));
  const ecoles = boursesDesEcoles();
  const nbDetail = ecoles.filter((b) => b.detaille).length;
  const nbCent = ecoles.filter((b) => b.detaille && b.categories.includes("cent")).length;
  const couv = photo("laptop");
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(filAriane(SITE_URL, [["Bourses", "/bourses/"]])) }} />
      <section className="bg-gradient-to-br from-[#e8f8ef] to-[#f6f8fe] pb-8 pt-8">
        <div className="container grid items-center gap-8 lg:grid-cols-[1fr_400px]">
          <div className="flex flex-col gap-3">
            <nav className="flex items-center gap-1.5 text-[13px] text-ink-mute" aria-label="Fil d'Ariane"><Link href="/">Accueil</Link><ChevronRight size={14} /><span>Bourses</span></nav>
            <h1 className="h-section">Bourses d&apos;études</h1>
            <p className="max-w-3xl text-lg text-ink-soft">Bourses de l&apos;État de ton pays, du pays d&apos;études et <b className="text-ink">bourses et réductions des écoles</b> : conditions, montants et démarches, relevés sur les sources officielles.</p>
            <div className="mt-1 flex flex-wrap gap-x-8 gap-y-3">
              {([[BOURSES.length, "bourses publiques"], [nbDetail, "écoles qui détaillent leurs bourses"], [nbCent, "écoles avec des bourses jusqu'à 100 %"]] as const).map(([n, l]) => <span key={l} className="flex flex-col"><b className="text-[28px] leading-none text-[#0b7a3d]">{n}</b><span className="mt-1 text-xs text-ink-mute">{l}</span></span>)}
            </div>
            <p className="text-sm text-ink-mute">Connecté·e, retrouve les bourses <Link href="/espace/bourses/" className="font-bold text-brand-600">pour toi</Link>, classées selon ton profil, avec une alerte avant la date limite.</p>
          </div>
          {couv && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={couv.src} srcSet={variantes(couv.src)} sizes="400px" alt={couv.alt} fetchPriority="high" className="hidden h-[250px] w-full rounded-[24px] object-cover lg:block" />
          )}
        </div>
      </section>
      <section className="container mt-8 flex flex-col gap-4" id="ecoles">
        <h2 className="text-[28px] font-extrabold tracking-tight">Bourses et réductions des écoles</h2>
        <p className="-mt-2 text-[15px] text-ink-mute">Ce que chaque école annonce sur son site officiel. Conditions exactes et dates : à confirmer auprès de l&apos;école.</p>
        {!!campagnes.length && (
          <ul className="grid gap-3 md:grid-cols-2">{campagnes.map((c) => (
            <li key={c.id}><Link href={`/etablissements/${c.eid}/#frais`} className="card flex h-full flex-col gap-1 rounded-[22px] border-2 border-sun-300 p-4 hover:shadow-lg"><span className="text-xs font-bold text-[#a55a00]">Campagne ouverte · {c.ecole}</span><b>{c.titre}</b>{c.conditions && <span className="line-clamp-2 text-sm text-ink-soft">{c.conditions}</span>}<span className="text-xs text-ink-mute">Jusqu&apos;au {new Date(c.fin).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span></Link></li>
          ))}</ul>
        )}
        <BoursesEcoles liste={ecoles} />
      </section>
      <section className="container mt-12 flex flex-col gap-4" id="publiques">
        <h2 className="text-[28px] font-extrabold tracking-tight">Bourses publiques</h2>
        <BoursesListe />
        <p className="flex gap-2 rounded-2xl bg-[#f6f8fe] p-4 text-sm text-ink-mute"><ShieldCheck size={17} className="mt-0.5 shrink-0 text-[#0b7a3d]" /><span>Informations relevées sur les sites officiels à la date indiquée, revues chaque année. L&apos;attribution d&apos;une bourse est toujours la décision de l&apos;organisme ou de l&apos;école : Navigoal ne la promet jamais. Une bourse manque ou a changé ? <a href="mailto:contact@navigoal.net?subject=Bourse" className="font-bold text-brand-600">contact@navigoal.net</a></span></p>
      </section>
    </>
  );
}
