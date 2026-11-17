import Link from "next/link";
import { notFound } from "next/navigation";
import { exigerAdmin } from "@/lib/auth";
import { accepterModifProfil, decisionTransitaire, refuserModifProfil } from "@/lib/actions/admin";
import { documentsDe, getTransitaire, offresDe } from "@/lib/queries";
import { BADGES, BADGE_CODES, MARCHANDISES, MODES, PAYS } from "@/lib/referentiel";
import { afficherTelephone, dateFr, fcfa } from "@/lib/format";
import { premier, type SP } from "@/lib/recherche";
import { Alerte } from "@/components/ui";
import { pret } from "@/lib/stockage";

export const metadata = { title: "Dossier transitaire", robots: { index: false } };

const DOC_LABEL: Record<string, string> = { rccm: "RCCM", identite: "Pièce d'identité du gérant", agrement: "Agrément en douane", entrepot: "Preuve d'entrepôt" };

export default async function DossierTransitaire({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SP> }) {
  await exigerAdmin();
  await pret();
  const t = getTransitaire(Number((await params).id));
  if (!t) notFound();
  const docs = documentsDe(t.id);
  const offres = offresDe(t.id, ["valide", "en_attente"]);
  const ok = premier((await searchParams).ok);
  const ligne = (l: string, v: React.ReactNode) => (
    <div className="grid grid-cols-[160px_1fr] gap-2 border-b border-slate-100 py-2"><dt className="text-slate-500">{l}</dt><dd className="text-slate-900">{v || "—"}</dd></div>
  );

  return (
    <div className="conteneur max-w-4xl py-8">
      <Link href="/admin" className="text-sm text-marine-700 hover:underline">← Administration</Link>
      <h1 className="titre-page mt-2">{t.nom}</h1>
      <p className="text-sm text-slate-600">Statut actuel : <strong>{t.statut}</strong>{t.demo ? " · données de démonstration" : ""}</p>
      {ok && <div className="mt-4"><Alerte type="succes">Enregistré.</Alerte></div>}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="carte p-5 text-sm">
          <h2 className="font-bold text-marine-900">Informations déclarées</h2>
          <dl className="mt-2">
            {ligne("Gérant", t.gerant)}
            {ligne("RCCM", t.rccm)}
            {ligne("NIF", t.nif)}
            {ligne("Agrément douane", t.agrement_douane)}
            {ligne("Agence", `${t.adresse}, ${t.ville}`)}
            {ligne("Téléphone", afficherTelephone(t.telephone))}
            {ligne("WhatsApp", t.whatsapp ? afficherTelephone(t.whatsapp) : null)}
            {ligne("E-mail", t.email)}
            {ligne("Paiements", t.modes_paiement)}
            {ligne("Entrepôts", <ul>{t.entrepots.map((e, i) => <li key={i}>{PAYS[e.pays]?.nom} — {e.ville} — {e.adresse}</li>)}</ul>)}
            {ligne("Refuse", t.marchandises_refusees.map((m) => MARCHANDISES[m]?.label).join(", "))}
            {ligne("Déposé le", dateFr(t.created_at))}
          </dl>
          <h3 className="mt-4 font-semibold text-marine-900">Justificatifs</h3>
          <ul className="mt-1 space-y-1">
            {docs.length === 0 && <li className="text-slate-500">Aucun document.</li>}
            {docs.map((d) => (
              <li key={d.id}><a className="text-marine-700 underline" href={`/admin/documents/${d.id}`} target="_blank" rel="noopener">{DOC_LABEL[d.type] ?? d.type}</a> <span className="text-slate-500">({d.nom_original})</span></li>
            ))}
          </ul>
        </section>

        <section className="carte p-5 text-sm">
          <h2 className="font-bold text-marine-900">Décision</h2>
          <p className="mt-1 text-slate-600">Cochez uniquement les éléments effectivement contrôlés (document original, appel, visite ou vérification auprès du partenaire).</p>
          <form action={decisionTransitaire} className="mt-3 grid gap-3">
            <input type="hidden" name="id" value={t.id} />
            <fieldset className="grid gap-1.5">
              <legend className="etiquette">Badges vérifiés</legend>
              {BADGE_CODES.map((b) => (
                <label key={b} className="flex items-center gap-2">
                  <input type="checkbox" name="badges" value={b} defaultChecked={t.badges.includes(b)} className="h-5 w-5 accent-marine-900" />
                  {BADGES[b].label} <span className="text-xs text-slate-500">— {BADGES[b].description}</span>
                </label>
              ))}
            </fieldset>
            <div>
              <label className="etiquette" htmlFor="statut">Statut</label>
              <select id="statut" name="statut" defaultValue={t.statut} className="champ">
                <option value="en_attente">En attente</option>
                <option value="verifie">Vérifié (publier la fiche)</option>
                <option value="refuse">Refusé</option>
                <option value="suspendu">Suspendu</option>
              </select>
            </div>
            <div>
              <label className="etiquette" htmlFor="note">Message au transitaire (visible dans son espace)</label>
              <textarea id="note" name="note" rows={2} className="champ" defaultValue={t.note_admin ?? ""} />
            </div>
            <button className="btn-marine" type="submit">Enregistrer</button>
          </form>
        </section>
      </div>

      {t.modif_en_attente && (
        <section className="carte mt-6 p-5 text-sm">
          <h2 className="font-bold text-marine-900">Modifications de profil proposées</h2>
          <dl className="mt-2">
            {ligne("Présentation", t.modif_en_attente.description)}
            {ligne("Adresse", t.modif_en_attente.adresse)}
            {ligne("WhatsApp", t.modif_en_attente.whatsapp ? afficherTelephone(t.modif_en_attente.whatsapp) : null)}
            {ligne("E-mail", t.modif_en_attente.email)}
            {ligne("Paiements", t.modif_en_attente.modes_paiement)}
            {ligne("Entrepôts", <ul>{t.modif_en_attente.entrepots.map((e, i) => <li key={i}>{PAYS[e.pays]?.nom} — {e.ville} — {e.adresse}</li>)}</ul>)}
            {ligne("Refuse", t.modif_en_attente.marchandises_refusees.map((m) => MARCHANDISES[m]?.label).join(", "))}
          </dl>
          <form action={accepterModifProfil} className="mt-3 flex gap-2">
            <input type="hidden" name="id" value={t.id} />
            <button type="submit" className="btn-marine">Accepter</button>
            <button type="submit" formAction={refuserModifProfil} className="btn-danger">Refuser</button>
          </form>
        </section>
      )}

      <section className="carte mt-6 p-5 text-sm">
        <h2 className="font-bold text-marine-900">Offres</h2>
        <ul className="mt-2 space-y-1">
          {offres.length === 0 && <li className="text-slate-500">Aucune offre.</li>}
          {offres.map((o) => (
            <li key={o.id}>{o.statut === "valide" ? "✔" : "⏳"} {MODES[o.mode].label} · {o.origine_ville} · {fcfa(o.prix_xaf)} · {o.delai_min}–{o.delai_max} j</li>
          ))}
        </ul>
        <Link href="/admin#offres" className="mt-2 inline-block text-marine-700 underline">Vérifier les tarifs en attente</Link>
      </section>
    </div>
  );
}
