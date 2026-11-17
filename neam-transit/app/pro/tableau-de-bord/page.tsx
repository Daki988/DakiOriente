import Link from "next/link";
import { exigerPro } from "@/lib/auth";
import { deconnexion, repondre, retirerOffre } from "@/lib/actions/pro";
import { avisDe, contactsParTransitaire, demandesRecues, getTransitaire, offresDe, statsTransitaires } from "@/lib/queries";
import { premier, type SP } from "@/lib/recherche";
import { MARCHANDISES, MODES, PAYS } from "@/lib/referentiel";
import { afficherTelephone, dateFr, fcfa, lienWhatsApp, nombre } from "@/lib/format";
import { Alerte, NoteCourte } from "@/components/ui";

export const metadata = { title: "Tableau de bord", robots: { index: false } };

const STATUT = {
  en_attente: ["En cours de vérification", "attention"],
  verifie: ["Vérifié — fiche en ligne", "succes"],
  refuse: ["Refusé", "erreur"],
  suspendu: ["Suspendu", "erreur"],
} as const;

export default async function TableauDeBord({ searchParams }: { searchParams: Promise<SP> }) {
  const tid = await exigerPro();
  const sp = await searchParams;
  const t = getTransitaire(tid)!;
  const offres = offresDe(tid, ["valide", "en_attente", "rejete"]);
  const demandes = demandesRecues(tid);
  const avis = avisDe(tid);
  const s = statsTransitaires([tid]).get(tid)!;
  const contacts = Object.fromEntries(contactsParTransitaire(tid).map((c) => [c.canal, c.n]));
  const [statutLabel, statutType] = STATUT[t.statut];

  return (
    <div className="conteneur py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="titre-page">{t.nom}</h1>
          <p className="text-sm text-slate-600">Connecté avec le {afficherTelephone(t.telephone)}</p>
        </div>
        <div className="flex gap-2">
          {t.statut === "verifie" && <Link href={`/transitaires/${t.slug}`} className="btn-contour">Voir ma fiche</Link>}
          <Link href="/pro/profil" className="btn-contour">Mon profil</Link>
          <form action={deconnexion}><button className="btn-contour" type="submit">Déconnexion</button></form>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {premier(sp.bienvenue) && <Alerte type="succes">Merci ! Votre dossier est envoyé. Ajoutez dès maintenant vos tarifs : ils seront vérifiés en même temps que votre fiche.</Alerte>}
        {premier(sp.offre) && <Alerte type="succes">Offre envoyée pour vérification.</Alerte>}
        {premier(sp.profil) && <Alerte type="succes">Modifications envoyées pour vérification.</Alerte>}
        {premier(sp.reponse) && <Alerte type="succes">Réponse envoyée pour vérification.</Alerte>}
        <Alerte type={statutType}>
          Statut : <strong>{statutLabel}</strong>
          {t.note_admin && <> — {t.note_admin}</>}
        </Alerte>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        {[
          ["Demandes de devis (30 j)", contacts.devis ?? 0],
          ["Clics WhatsApp (30 j)", contacts.whatsapp ?? 0],
          ["Appels (30 j)", contacts.appel ?? 0],
        ].map(([l, n]) => (
          <div key={l} className="carte p-4"><p className="text-xs text-slate-500">{l}</p><p className="text-2xl font-extrabold text-marine-900">{n}</p></div>
        ))}
        <div className="carte p-4"><p className="text-xs text-slate-500">Note</p><NoteCourte stats={s} /></div>
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-marine-900">Mes offres</h2>
          <Link href="/pro/offres/nouvelle" className="btn-primaire">+ Ajouter une offre</Link>
        </div>
        {offres.length === 0 ? (
          <p className="carte mt-3 p-5 text-sm text-slate-600">Aucune offre. Ajoutez vos tarifs pour apparaître dans les comparaisons.</p>
        ) : (
          <div className="carte mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr><th className="p-3">Route</th><th className="p-3">Mode</th><th className="p-3">Prix</th><th className="p-3">Délai</th><th className="p-3">Statut</th><th className="p-3"></th></tr>
              </thead>
              <tbody>
                {offres.map((o) => (
                  <tr key={o.id} className="border-t border-slate-100">
                    <td className="p-3">{PAYS[o.origine_pays].drapeau} {o.origine_ville}</td>
                    <td className="p-3">{MODES[o.mode].label}</td>
                    <td className="p-3 whitespace-nowrap">{fcfa(o.prix_xaf)}</td>
                    <td className="p-3 whitespace-nowrap">{o.delai_min}–{o.delai_max} j</td>
                    <td className="p-3">
                      {o.statut === "valide" ? <span className="pastille bg-verifie-100 text-verifie-600">En ligne</span>
                        : o.statut === "en_attente" ? <span className="pastille bg-alerte-100 text-alerte-600">{o.remplace_id ? "Modification à vérifier" : "À vérifier"}</span>
                        : <span className="pastille bg-red-100 text-red-700" title={o.motif_rejet ?? ""}>Refusée{o.motif_rejet ? ` : ${o.motif_rejet}` : ""}</span>}
                    </td>
                    <td className="p-3">
                      {o.statut === "valide" && (
                        <div className="flex gap-2">
                          <Link href={`/pro/offres/${o.id}`} className="text-marine-700 underline">Modifier</Link>
                          <form action={retirerOffre}><input type="hidden" name="id" value={o.id} /><button className="text-red-700 underline" type="submit">Retirer</button></form>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-marine-900">Demandes reçues</h2>
        {demandes.length === 0 ? (
          <p className="carte mt-3 p-5 text-sm text-slate-600">Aucune demande pour le moment.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {demandes.map((d) => (
              <li key={d.id} className="carte p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-marine-900">{d.nom} · {afficherTelephone(d.telephone)}</p>
                  <p className="text-xs text-slate-500">{dateFr(d.created_at)} · réf. {d.ref}</p>
                </div>
                <p className="mt-1 text-slate-700">
                  {PAYS[d.origine_pays].drapeau} {d.origine_ville ?? PAYS[d.origine_pays].nom} → {d.ville_destination} · {MARCHANDISES[d.marchandise].label}
                  {d.mode ? ` · ${MODES[d.mode].label}` : ""}{d.poids ? ` · ${nombre(d.poids)} kg` : ""}{d.volume ? ` · ${nombre(d.volume)} m³` : ""}{d.quantite ? ` · qté ${d.quantite}` : ""}
                </p>
                {d.description && <p className="mt-1 text-slate-600">« {d.description} »</p>}
                <a className="btn-whatsapp mt-3" href={lienWhatsApp(d.telephone, `Bonjour ${d.nom}, ${t.nom} ici, suite à votre demande Neam Transit (réf. ${d.ref}).`)} target="_blank" rel="noopener">Répondre sur WhatsApp</a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-marine-900">Avis publiés</h2>
        {avis.length === 0 ? (
          <p className="carte mt-3 p-5 text-sm text-slate-600">Aucun avis publié.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {avis.map((a) => (
              <li key={a.id} className="carte p-4 text-sm">
                <p className="font-semibold">{a.nom} — {nombre((a.note_prix + a.note_delai + a.note_etat + a.note_service) / 4, 1)}/5</p>
                {a.commentaire && <p className="mt-1 text-slate-700">{a.commentaire}</p>}
                {a.reponse ? (
                  <p className="mt-2 rounded-lg bg-marine-50 p-2 text-slate-700">Votre réponse ({a.reponse_statut === "publie" ? "publiée" : a.reponse_statut === "rejete" ? "refusée" : "en vérification"}) : {a.reponse}</p>
                ) : (
                  <form action={repondre} className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <input type="hidden" name="avis_id" value={a.id} />
                    <input name="reponse" maxLength={800} className="champ" placeholder="Répondre publiquement…" aria-label="Votre réponse" />
                    <button type="submit" className="btn-contour">Envoyer</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
