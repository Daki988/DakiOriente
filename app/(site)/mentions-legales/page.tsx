import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { settings, fullAddress } from "@/lib/content";

export const metadata: Metadata = { title: "Mentions légales", alternates: { canonical: "/mentions-legales" } };

export default function Page() {
  return (
    <>
      <PageHero kicker="Informations" title="Mentions légales" />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-12 text-sm leading-relaxed text-text/85">
        <p className="rounded-xl border border-gold/40 bg-gold/10 p-4 text-gold">TODO : informations légales à fournir par l&apos;établissement (raison sociale, RCCM, NIF, responsable de publication).</p>
        <section><h2 className="mb-2 font-display text-2xl">Éditeur</h2><p>{settings.name} — {fullAddress()}. Téléphone : {settings.phones[0]?.display}.</p></section>
        <section><h2 className="mb-2 font-display text-2xl">Conception</h2><p>Site conçu et développé par NEAM.</p></section>
        <section><h2 className="mb-2 font-display text-2xl">Hébergement</h2><p>Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis (à confirmer selon l&apos;hébergement retenu).</p></section>
        <section><h2 className="mb-2 font-display text-2xl">Propriété intellectuelle</h2><p>Les contenus (logo, textes, photographies, vidéos) sont la propriété de {settings.name} sauf mention contraire.</p></section>
      </div>
    </>
  );
}
