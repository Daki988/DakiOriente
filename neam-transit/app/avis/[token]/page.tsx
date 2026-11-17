import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { envoyerAvis } from "@/lib/actions/public";
import { getLienAvis } from "@/lib/queries";
import { premier, type SP } from "@/lib/recherche";
import { MODES } from "@/lib/referentiel";
import { Alerte } from "@/components/ui";

export const metadata: Metadata = { title: "Noter un transitaire", robots: { index: false } };

const CRITERES = [
  ["note_prix", "Prix respecté (pas de frais surprise)"],
  ["note_delai", "Délai respecté"],
  ["note_etat", "État de la marchandise"],
  ["note_service", "Service client, réactivité"],
] as const;

export default async function AvisPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<SP> }) {
  const { token } = await params;
  const sp = await searchParams;
  const lien = getLienAvis(token);
  if (!lien || token.startsWith("demo-")) notFound();
  const { demande: d, transitaire: t } = lien;
  const aujourdhui = new Date().toISOString().slice(0, 10);

  if (premier(sp.merci) === "1" || lien.dejaNote) {
    return (
      <div className="conteneur max-w-2xl py-12">
        <Alerte type="succes">Merci ! Votre avis sur {t.nom} a bien été reçu. Il sera publié après vérification par notre équipe.</Alerte>
        <Link href={`/demande/${d.ref}`} className="btn-contour mt-6">Retour à ma demande</Link>
      </div>
    );
  }

  return (
    <div className="conteneur max-w-2xl py-8">
      <h1 className="titre-page">Noter {t.nom}</h1>
      <p className="mt-2 text-sm text-slate-600">Votre avis est vérifié avant publication. Les dates servent à calculer le délai réel du transitaire.</p>
      {premier(sp.erreur) && <div className="mt-4"><Alerte type="erreur">{premier(sp.erreur)}</Alerte></div>}
      <form action={envoyerAvis} className="carte mt-6 grid gap-5 p-5 sm:p-6">
        <input type="hidden" name="token" value={token} />
        <fieldset>
          <legend className="etiquette">Transport utilisé</legend>
          <div className="grid grid-cols-2 gap-2">
            {(["aerien", "maritime"] as const).map((f) => (
              <label key={f} className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 text-sm font-medium has-checked:border-marine-900 has-checked:bg-marine-50">
                <input type="radio" name="famille" value={f} required defaultChecked={d.mode ? MODES[d.mode].famille === f : undefined} className="accent-marine-900" />
                {f === "aerien" ? "✈️ Avion" : "🚢 Bateau"}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="etiquette" htmlFor="date_remise">Marchandise remise au transitaire le</label>
            <input id="date_remise" name="date_remise" type="date" required max={aujourdhui} className="champ" />
            <p className="aide">Date de réception à l&apos;entrepôt en Chine / Corée.</p>
          </div>
          <div>
            <label className="etiquette" htmlFor="date_reception">Marchandise disponible au Gabon le</label>
            <input id="date_reception" name="date_reception" type="date" required max={aujourdhui} className="champ" />
          </div>
        </div>
        {CRITERES.map(([k, l]) => (
          <fieldset key={k}>
            <legend className="etiquette">{l}</legend>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n} className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-slate-300 text-sm font-semibold has-checked:border-cargo-600 has-checked:bg-cargo-100">
                  <input type="radio" name={k} value={n} required className="sr-only" />
                  {n}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <div>
          <label className="etiquette" htmlFor="commentaire">Commentaire (facultatif)</label>
          <textarea id="commentaire" name="commentaire" rows={4} maxLength={1500} className="champ" />
        </div>
        <div>
          <label className="etiquette" htmlFor="nom">Nom affiché</label>
          <input id="nom" name="nom" maxLength={60} className="champ" defaultValue={d.nom.split(" ")[0]} />
        </div>
        <button className="btn-primaire text-base" type="submit">Envoyer mon avis</button>
      </form>
    </div>
  );
}
