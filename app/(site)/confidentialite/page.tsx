import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = { title: "Confidentialité", alternates: { canonical: "/confidentialite" } };

export default function Page() {
  return (
    <>
      <PageHero kicker="Vos données" title="Confidentialité" />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-12 text-sm leading-relaxed text-text/85">
        <section><h2 className="mb-2 font-display text-2xl">Données collectées</h2><p>Ce site ne comporte ni formulaire, ni compte client, ni cookie publicitaire. Aucune donnée personnelle n&apos;est collectée lors de votre navigation.</p></section>
        <section><h2 className="mb-2 font-display text-2xl">Services tiers</h2><p>La carte (OpenStreetMap) n&apos;est chargée que si vous cliquez sur « Afficher la carte ». Les liens d&apos;itinéraire ouvrent Google Maps, Waze ou Plans, soumis à leurs propres politiques.</p></section>
        <section><h2 className="mb-2 font-display text-2xl">Mesure d&apos;audience</h2><p>Si une mesure d&apos;audience est activée, elle sera respectueuse de la vie privée (sans cookie, données agrégées). Cette page sera mise à jour en conséquence.</p></section>
      </div>
    </>
  );
}
