import Link from "next/link";
import { exigerAdmin } from "@/lib/auth";
import { chargerDemo, deconnexionAdmin, publierAction, refuserOffreAction, rejeterAction, supprimerDemo, validerOffreAction } from "@/lib/actions/admin";
import { avisEnAttente, chiffres, dernieresDemandes, getOffre, listTransitaires, listTransitairesModifEnAttente, offresEnAttente } from "@/lib/queries";
import { MARCHANDISES, MODES, PAYS } from "@/lib/referentiel";
import { afficherTelephone, dateFr, fcfa, nombre } from "@/lib/format";

export const metadata = { title: "Administration", robots: { index: false } };

const LIVRAISON = { retrait: "Retrait en agence", grand_libreville: "Livraison Grand Libreville", tout_gabon: "Livraison province" } as const;

export default async function Admin() {
  await exigerAdmin();
  const c = chiffres();
  const enAttente = listTransitaires("en_attente");
  const modifs = listTransitairesModifEnAttente();
  const offres = offresEnAttente();
  const avis = avisEnAttente();
  const demandes = dernieresDemandes();
  const tous = listTransitaires();

  return (
    <div className="conteneur py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="titre-page">Administration</h1>
        <form action={deconnexionAdmin}><button className="btn-contour" type="submit">Déconnexion</button></form>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Transitaires vérifiés", c.transitairesVerifies],
          ["Dossiers à vérifier", c.transitairesEnAttente],
          ["Demandes (30 j)", c.demandes30j],
          ["Mises en relation (30 j)", c.contacts30j],
        ].map(([l, n]) => (
          <div key={l} className="carte p-4"><p className="text-xs text-slate-500">{l}</p><p className="text-2xl font-extrabold text-marine-900">{n}</p></div>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-marine-900">Dossiers transitaires à vérifier ({enAttente.length})</h2>
        <ul className="mt-3 space-y-2">
          {enAttente.length === 0 && <li className="carte p-4 text-sm text-slate-600">Aucun dossier en attente.</li>}
          {enAttente.map((t) => (
            <li key={t.id} className="carte flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
              <span><strong>{t.nom}</strong> · {t.ville} · {afficherTelephone(t.telephone)} · déposé le {dateFr(t.created_at)}</span>
              <Link href={`/admin/transitaires/${t.id}`} className="btn-marine">Examiner</Link>
            </li>
          ))}
        </ul>
      </section>

      {modifs.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-bold text-marine-900">Modifications de profil à vérifier ({modifs.length})</h2>
          <ul className="mt-3 space-y-2">
            {modifs.map((t) => (
              <li key={t.id} className="carte flex items-center justify-between gap-2 p-4 text-sm">
                <strong>{t.nom}</strong>
                <Link href={`/admin/transitaires/${t.id}`} className="btn-marine">Examiner</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8" id="offres">
        <h2 className="text-lg font-bold text-marine-900">Tarifs à vérifier ({offres.length})</h2>
        <ul className="mt-3 space-y-3">
          {offres.length === 0 && <li className="carte p-4 text-sm text-slate-600">Aucun tarif en attente.</li>}
          {offres.map((o) => {
            const ancien = o.remplace_id ? getOffre(o.remplace_id) : null;
            return (
              <li key={o.id} className="carte p-4 text-sm">
                <p className="font-semibold text-marine-900">{o.transitaire_nom} — {MODES[o.mode].label} depuis {o.origine_ville} ({PAYS[o.origine_pays].nom}){ancien ? " · MODIFICATION" : ""}</p>
                <p className="mt-1 text-slate-700">
                  {fcfa(o.prix_xaf)} / {MODES[o.mode].unite} {ancien && <span className="text-slate-500">(avant : {fcfa(ancien.prix_xaf)})</span>} · min. {nombre(o.minimum)} · frais fixes {fcfa(o.frais_fixes_xaf)} · {o.delai_min}–{o.delai_max} j
                  {ancien && <span className="text-slate-500"> (avant : {ancien.delai_min}–{ancien.delai_max} j)</span>}
                </p>
                <p className="text-slate-700">{o.dedouanement_inclus ? "Dédouanement inclus" : "Dédouanement non inclus"} · {LIVRAISON[o.livraison]}{o.villes_desservies.length ? ` (${o.villes_desservies.join(", ")})` : ""} · {o.marchandises.map((m) => MARCHANDISES[m].label).join(", ")}</p>
                <p className="text-slate-600">Inclus : {o.inclus || "—"} · Non inclus : {o.non_inclus || "—"}</p>
                <form action={validerOffreAction} className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input type="hidden" name="id" value={o.id} />
                  <input name="motif" className="champ" placeholder="Motif en cas de refus" aria-label="Motif du refus" />
                  <button type="submit" className="btn-marine">Valider</button>
                  <button type="submit" formAction={refuserOffreAction} className="btn-danger">Refuser</button>
                </form>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-8" id="avis">
        <h2 className="text-lg font-bold text-marine-900">Avis et réponses à modérer ({avis.length})</h2>
        <ul className="mt-3 space-y-3">
          {avis.length === 0 && <li className="carte p-4 text-sm text-slate-600">Rien à modérer.</li>}
          {avis.map((a) => {
            const j = Math.round((Date.parse(a.date_reception) - Date.parse(a.date_remise)) / 86400000);
            return (
              <li key={a.id} className="carte p-4 text-sm">
                <p className="font-semibold text-marine-900">{a.transitaire_nom} — avis de {a.nom}</p>
                <p className="text-slate-700">{a.famille === "aerien" ? "Aérien" : "Maritime"} · remis le {dateFr(a.date_remise)} · reçu le {dateFr(a.date_reception)} ({j} j) · Prix {a.note_prix} · Délai {a.note_delai} · État {a.note_etat} · Service {a.note_service}</p>
                {a.commentaire && <p className="mt-1 text-slate-700">« {a.commentaire} »</p>}
                {a.statut === "en_attente" && (
                  <form action={publierAction} className="mt-2 flex gap-2">
                    <input type="hidden" name="id" value={a.id} /><input type="hidden" name="cible" value="avis" />
                    <button type="submit" className="btn-marine">Publier l&apos;avis</button>
                    <button type="submit" formAction={rejeterAction} className="btn-danger">Rejeter</button>
                  </form>
                )}
                {a.reponse_statut === "en_attente" && (
                  <div className="mt-3 rounded-lg bg-marine-50 p-3">
                    <p>Réponse du transitaire : « {a.reponse} »</p>
                    <form action={publierAction} className="mt-2 flex gap-2">
                      <input type="hidden" name="id" value={a.id} /><input type="hidden" name="cible" value="reponse" />
                      <button type="submit" className="btn-marine">Publier la réponse</button>
                      <button type="submit" formAction={rejeterAction} className="btn-danger">Rejeter</button>
                    </form>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-marine-900">Dernières demandes</h2>
        <div className="carte mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Date</th><th className="p-3">Client</th><th className="p-3">Route</th><th className="p-3">Transitaires</th></tr></thead>
            <tbody>
              {demandes.length === 0 && <tr><td className="p-3 text-slate-600" colSpan={4}>Aucune demande.</td></tr>}
              {demandes.map((d) => (
                <tr key={d.id} className="border-t border-slate-100">
                  <td className="p-3 whitespace-nowrap">{dateFr(d.created_at)}</td>
                  <td className="p-3">{d.nom}<br /><span className="text-slate-500">{afficherTelephone(d.telephone)}</span></td>
                  <td className="p-3">{PAYS[d.origine_pays].nom} → {d.ville_destination}</td>
                  <td className="p-3">{d.transitaires}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-marine-900">Tous les transitaires ({tous.length})</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {tous.map((t) => (
            <li key={t.id} className="carte flex items-center justify-between gap-2 p-3 text-sm">
              <span>{t.nom} <span className="text-slate-500">· {t.statut}{t.demo ? " · démo" : ""}</span></span>
              <Link href={`/admin/transitaires/${t.id}`} className="text-marine-700 underline">Gérer</Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="carte mt-8 p-5">
        <h2 className="font-bold text-marine-900">Données de démonstration</h2>
        <p className="mt-1 text-sm text-slate-600">{c.demo} transitaire(s) fictif(s) chargé(s). À supprimer avant l&apos;ouverture au public.</p>
        <form action={chargerDemo} className="mt-3 flex gap-2">
          <button type="submit" className="btn-contour">Charger la démo</button>
          <button type="submit" formAction={supprimerDemo} className="btn-danger">Supprimer la démo</button>
        </form>
      </section>
    </div>
  );
}
