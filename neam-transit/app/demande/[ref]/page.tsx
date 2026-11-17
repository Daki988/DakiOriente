import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDemande } from "@/lib/queries";
import { messageContact } from "@/lib/messages";
import { MARCHANDISES, MODES, PAYS } from "@/lib/referentiel";
import { dateFr, nombre, SITE_URL } from "@/lib/format";
import { Alerte } from "@/components/ui";
import { pret } from "@/lib/stockage";

export const metadata: Metadata = { title: "Votre demande", robots: { index: false } };

export default async function DemandePage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  await pret();
  const d = getDemande(ref);
  if (!d || ref.startsWith("DEMO-")) notFound();
  const message = messageContact({ pays: d.origine_pays, ville: d.origine_ville, destination: d.ville_destination, mode: d.mode, marchandise: d.marchandise, poids: d.poids, volume: d.volume, quantite: d.quantite, ref: d.ref });

  return (
    <div className="conteneur max-w-3xl py-8">
      <Alerte type="succes">Demande enregistrée le {dateFr(d.created_at)} — référence <strong>{d.ref}</strong>.</Alerte>
      <h1 className="titre-page mt-6">Et maintenant ?</h1>
      <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-700">
        <li>Les transitaires choisis voient votre demande dans leur espace.</li>
        <li>Pour aller plus vite, envoyez-leur aussi votre demande sur WhatsApp (message déjà rédigé).</li>
        <li>Comparez les devis reçus, puis payez <strong>directement</strong> le transitaire retenu.</li>
        <li>Après réception de votre marchandise, notez le transitaire avec le lien ci-dessous.</li>
      </ol>

      <div className="carte mt-6 p-5 text-sm">
        <h2 className="font-semibold text-marine-900">Votre envoi</h2>
        <p className="mt-1 text-slate-700">
          {PAYS[d.origine_pays].drapeau} {d.origine_ville ? `${d.origine_ville}, ` : ""}{PAYS[d.origine_pays].nom} → {d.ville_destination} · {MARCHANDISES[d.marchandise].label}
          {d.mode ? ` · ${MODES[d.mode].label}` : ""}
          {d.poids ? ` · ${nombre(d.poids)} kg` : ""}{d.volume ? ` · ${nombre(d.volume)} m³` : ""}{d.quantite ? ` · quantité ${d.quantite}` : ""}
        </p>
      </div>

      <ul className="mt-4 space-y-3">
        {d.transitaires.map(({ transitaire: t, token_avis, avis }) => (
          <li key={t.id} className="carte p-5">
            <p className="font-bold text-marine-900">{t.nom}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a className="btn-whatsapp" href={`/go/${t.id}?canal=whatsapp&m=${encodeURIComponent(message)}`} rel="nofollow">Envoyer sur WhatsApp</a>
              <Link className="btn-contour" href={`/transitaires/${t.slug}`}>Fiche</Link>
              {avis ? (
                <span className="btn cursor-default text-verifie-600">✔ Avis envoyé</span>
              ) : (
                <Link className="btn-contour" href={`/avis/${token_avis}`}>Noter après réception</Link>
              )}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <Alerte type="attention">
          Gardez cette page : elle contient vos liens pour noter les transitaires. Adresse : {SITE_URL}/demande/{d.ref}
        </Alerte>
      </div>
    </div>
  );
}
