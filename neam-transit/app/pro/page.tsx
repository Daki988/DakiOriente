import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Espace transitaire" };

export default async function Pro() {
  if ((await getSession())?.role === "pro") redirect("/pro/tableau-de-bord");
  return (
    <div className="conteneur max-w-4xl py-10">
      <h1 className="titre-page">Transitaires : recevez des clients qualifiés</h1>
      <p className="mt-3 max-w-2xl text-slate-700">
        Neam Transit présente vos offres aux importateurs de tout le Gabon qui cherchent à expédier depuis la Chine ou la Corée du Sud. Le référencement est gratuit.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          ["Demandes qualifiées", "Départ, arrivée, poids, volume, marchandise : vous recevez des demandes précises, avec le contact du client."],
          ["Badge vérifié", "Vos documents sont contrôlés : les clients savent qu'ils traitent avec une entreprise sérieuse."],
          ["Vos délais réels", "Vos bons délais deviennent un argument : ils sont mesurés sur les envois de vos clients."],
        ].map(([t, d]) => (
          <div key={t} className="carte p-5">
            <h2 className="font-semibold text-marine-900">{t}</h2>
            <p className="mt-1 text-sm text-slate-600">{d}</p>
          </div>
        ))}
      </div>
      <div className="carte mt-6 p-5 text-sm text-slate-700">
        <h2 className="font-semibold text-marine-900">Comment ça marche</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Vous créez votre fiche et déposez vos justificatifs (RCCM, pièce d&apos;identité du gérant, agrément en douane si vous en avez un, preuve d&apos;entrepôt).</li>
          <li>Notre équipe vérifie vos informations. Votre fiche n&apos;est visible qu&apos;une fois vérifiée.</li>
          <li>Vous publiez vos tarifs : chaque tarif est relu avant sa mise en ligne.</li>
          <li>Les clients vous contactent directement et vous paient directement : aucun paiement ne passe par Neam Transit.</li>
        </ol>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/pro/inscription" className="btn-primaire">Référencer mon entreprise</Link>
        <Link href="/pro/connexion" className="btn-contour">J&apos;ai déjà un compte</Link>
      </div>
    </div>
  );
}
