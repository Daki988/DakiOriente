import type { Metadata } from "next";
import { Suspense } from "react";
import { FormationDetail } from "@/components/sections/FormationDetail";
import { villesOffre } from "@/lib/catalogue";
import { etabById, formationById, formations } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

export const generateStaticParams = () => formations.map((f) => ({ id: f.id }));
export const generateMetadata = ({ params }: { params: { id: string } }): Metadata => {
  const f = formationById[params.id];
  if (!f) return {};
  const n = f.etablissements.length;
  return {
    title: `${f.intitule} au Maroc : écoles, diplôme, admission et débouchés`,
    description: `${f.intitule} (${f.diplome}, ${f.duree_annees} an${f.duree_annees > 1 ? "s" : ""}) : ${n} établissement${n > 1 ? "s" : ""} au Maroc, conditions d'admission, programme, frais et métiers visés. Candidature en ligne depuis toute l'Afrique.`,
    alternates: { canonical: `/formations/${f.id}/` },
  };
};

/** Données structurées schema.org : la formation et les établissements qui la proposent. */
function jsonLd(id: string) {
  const f = formationById[id];
  if (!f) return null;
  return {
    "@context": "https://schema.org", "@type": "Course", name: f.intitule, url: `${SITE_URL}/formations/${f.id}/`, inLanguage: "fr",
    educationalCredentialAwarded: f.diplome, timeRequired: `P${f.duree_annees}Y`,
    provider: f.etablissements.map((x) => etabById[x]).filter(Boolean).slice(0, 20).map((e) => ({ "@type": "CollegeOrUniversity", name: e.nom, url: `${SITE_URL}/etablissements/${e.id}/` })),
    hasCourseInstance: f.etablissements.map((x) => etabById[x]).filter(Boolean).slice(0, 20).flatMap((e) => villesOffre(e, f.id).map((v) => ({ "@type": "CourseInstance", courseMode: "onsite", location: { "@type": "Place", name: `${e.sigle || e.nom} – ${v}`, address: { "@type": "PostalAddress", addressLocality: v, addressCountry: "MA" } } }))),
  };
}

export default function FormationPage({ params }: { params: { id: string } }) {
  const ld = jsonLd(params.id);
  return (
    <>
      {ld && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />}
      <Suspense><FormationDetail id={params.id} /></Suspense>
    </>
  );
}
