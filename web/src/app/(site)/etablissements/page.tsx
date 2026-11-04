import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/ui/PageHero";
import { EtabList } from "@/components/sections/EtabList";
import { DESTINATIONS_ACTIVES, PAYS_ACTIFS_TEXTE, etablissements, stats } from "@/lib/data";

const PAYS = DESTINATIONS_ACTIVES.map((d) => d.nom).join(", ");
export const metadata: Metadata = { title: `Écoles et universités privées reconnues (${PAYS})`, description: `Compare les écoles et universités privées reconnues ${PAYS_ACTIFS_TEXTE} : reconnaissance par l'État, filières accréditées, frais, campus et logement. Candidature en ligne.`, alternates: { canonical: "/etablissements/" } };

export default function EtablissementsPage() {
  const detail = DESTINATIONS_ACTIVES.map((d) => `${d.etablissements} ${d.prep}`).join(", ");
  return (
    <>
      <PageHero crumb="Établissements" title="Écoles et universités" accent="privées reconnues" sub={`${etablissements.length} établissements privés (${detail}), dont ${stats.homologues} aux diplômes reconnus par l'État, qui accueillent les étudiants de toute l'Afrique.`} hand="Compare avant de choisir !" />
      <Suspense><EtabList /></Suspense>
    </>
  );
}
