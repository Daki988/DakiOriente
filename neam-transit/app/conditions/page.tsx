import type { Metadata } from "next";

export const metadata: Metadata = { title: "Conditions d'utilisation" };

export default function Conditions() {
  return (
    <div className="conteneur max-w-3xl py-8">
      <h1 className="titre-page">Conditions d&apos;utilisation</h1>
      <p className="mt-2 text-xs text-slate-500">Version provisoire — à faire valider par un juriste avant la mise en ligne publique.</p>
      <div className="carte mt-6 space-y-4 p-6 text-sm leading-relaxed text-slate-700">
        <h2 className="font-bold text-marine-900">1. Rôle de Neam Transit</h2>
        <p>Neam Transit est un service de comparaison et de mise en relation entre importateurs et transitaires. Neam Transit ne transporte aucune marchandise, n&apos;est pas commissionnaire en douane et n&apos;est pas partie aux contrats conclus entre les clients et les transitaires.</p>
        <h2 className="font-bold text-marine-900">2. Aucun paiement sur la plateforme</h2>
        <p>Aucun paiement ne transite par Neam Transit. Le client règle directement le transitaire, selon les conditions convenues avec lui. Neam Transit ne demandera jamais de paiement pour le compte d&apos;un transitaire.</p>
        <h2 className="font-bold text-marine-900">3. Informations vérifiées</h2>
        <p>Les transitaires, leurs tarifs et les avis sont contrôlés avant publication. Les coûts affichés sont des estimations calculées à partir des tarifs publiés ; seul le devis du transitaire engage celui-ci.</p>
        <h2 className="font-bold text-marine-900">4. Avis</h2>
        <p>Seuls les clients ayant fait une demande via Neam Transit peuvent noter un transitaire. Les avis sont modérés : contenus injurieux, diffamatoires ou sans rapport avec l&apos;envoi sont refusés. Un avis négatif ne peut pas être retiré à la demande du transitaire.</p>
        <h2 className="font-bold text-marine-900">5. Données personnelles</h2>
        <p>Votre nom, votre téléphone et le détail de votre demande sont transmis uniquement aux transitaires que vous choisissez. Vous pouvez demander l&apos;accès, la rectification ou la suppression de vos données en contactant Neam Transit. Les documents des transitaires ne sont accessibles qu&apos;à l&apos;équipe de vérification.</p>
        <h2 className="font-bold text-marine-900">6. Signalements et sanctions</h2>
        <p>Tout comportement frauduleux peut être signalé. Neam Transit peut avertir, suspendre ou retirer un transitaire, sans intervenir dans les flux financiers entre les parties.</p>
      </div>
    </div>
  );
}
