import type { Metadata } from "next";
import { ChevronRight, ShieldCheck } from "lucide-react";
import Link from "@/components/ui/Link";
import { BoursesListe } from "@/components/sections/BoursesListe";
import { listCampaigns } from "@/server/services/establishments";
import { etabById } from "@/lib/data";
import { filAriane } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Bourses d'études pour étudier à l'étranger : conditions et démarches",
  description: "Bourses publiques des pays d'origine et des pays d'études, bourses des écoles : conditions, pièces, calendrier et liens officiels, vérifiés par Navigoal.",
  alternates: { canonical: "/bourses/" },
};

export default async function BoursesPage() {
  const campagnes = (await listCampaigns({ publishedOnly: true, current: true }).catch(() => []))
    .filter((c) => c.kind === "bourse" && etabById[c.establishmentId])
    .map((c) => ({ id: c.id, eid: c.establishmentId, ecole: etabById[c.establishmentId].sigle || etabById[c.establishmentId].nom, titre: c.title, fin: c.endsAt.toISOString(), conditions: c.conditions }));
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(filAriane(SITE_URL, [["Bourses", "/bourses/"]])) }} />
      <section className="bg-gradient-to-br from-[#e8f8ef] to-[#f6f8fe] pb-8 pt-10">
        <div className="container flex flex-col gap-3">
          <nav className="flex items-center gap-1.5 text-[13px] text-ink-mute"><Link href="/">Accueil</Link><ChevronRight size={14} /><span>Bourses</span></nav>
          <h1 className="h-section">Bourses d&apos;études</h1>
          <p className="max-w-3xl text-lg text-ink-soft">Les aides auxquelles tu peux prétendre pour financer tes études : bourses de l&apos;État de ton pays, bourses du pays d&apos;études et bourses des écoles. Conditions, pièces et démarche, recopiées des sources officielles.</p>
          <p className="max-w-3xl text-sm text-ink-mute">Connecté·e, retrouve dans ton espace les bourses <Link href="/espace/bourses/" className="font-bold text-brand-600">pour toi</Link>, classées selon ton profil, et reçois une alerte avant la date limite.</p>
        </div>
      </section>
      <section className="container mt-8 flex flex-col gap-8">
        <BoursesListe campagnes={campagnes} />
        <p className="flex gap-2 rounded-2xl bg-[#f6f8fe] p-4 text-sm text-ink-mute"><ShieldCheck size={17} className="mt-0.5 shrink-0 text-[#0b7a3d]" /><span>Informations vérifiées sur les sites officiels à la date indiquée sur chaque fiche, revues chaque année. L&apos;attribution d&apos;une bourse est toujours la décision de l&apos;organisme : Navigoal ne la promet jamais. Une bourse manque ? <a href="mailto:contact@navigoal.net?subject=Bourse" className="font-bold text-brand-600">contact@navigoal.net</a></span></p>
      </section>
    </>
  );
}
