import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { avisDe, getTransitaireBySlug, offresDe, statsTransitaires } from "@/lib/queries";
import { MARCHANDISES, MODES, PAYS } from "@/lib/referentiel";
import { afficherTelephone, dateFr, fcfa, nombre } from "@/lib/format";
import { Alerte, Badges, DelaiReelTexte, Etoiles, NoteCourte, PastilleDemo, PastilleVerifie } from "@/components/ui";
import { pret } from "@/lib/stockage";

type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  await pret();
  const t = getTransitaireBySlug((await params).slug);
  return t && t.statut === "verifie" ? { title: `${t.nom} — transitaire vérifié`, description: t.description.slice(0, 160) } : { title: "Transitaire introuvable" };
}

const LIVRAISON = { retrait: "Retrait en agence", grand_libreville: "Livraison Grand Libreville", tout_gabon: "Livraison dans tout le Gabon" } as const;
const UNITE_PRIX = { kg: "/ kg", cbm: "/ m³", conteneur: "/ conteneur", vehicule: "/ véhicule" } as const;

export default async function FicheTransitaire({ params }: P) {
  await pret();
  const t = getTransitaireBySlug((await params).slug);
  if (!t || t.statut !== "verifie") notFound();
  const offres = offresDe(t.id);
  const s = statsTransitaires([t.id]).get(t.id)!;
  const avis = avisDe(t.id);

  return (
    <div className="conteneur py-8">
      <Link href="/transitaires" className="text-sm text-marine-700 hover:underline">← Tous les transitaires</Link>
      <div className="mt-3 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <header className="carte p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="titre-page">{t.nom}</h1>
              <PastilleVerifie />
              {t.demo && <PastilleDemo />}
            </div>
            <div className="mt-2"><NoteCourte stats={s} /></div>
            <p className="mt-3 text-slate-700">{t.description}</p>
            <div className="mt-4"><Badges badges={t.badges} delaisTenus={s.delaisTenus} /></div>
            <p className="mt-3 text-xs text-slate-500">Vérifié le {dateFr(t.verified_at)}</p>
          </header>

          <section className="carte p-5 sm:p-6">
            <h2 className="text-lg font-bold text-marine-900">Délais réels</h2>
            <div className="mt-2 space-y-1">
              <p><span className="font-medium">✈️ Aérien — </span><DelaiReelTexte d={s.delais.aerien} famille="aerien" /></p>
              <p><span className="font-medium">🚢 Maritime — </span><DelaiReelTexte d={s.delais.maritime} famille="maritime" /></p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-marine-900">Offres vérifiées</h2>
            {offres.length === 0 ? (
              <p className="carte mt-3 p-5 text-sm text-slate-600">Aucune offre publiée pour le moment.</p>
            ) : (
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {offres.map((o) => {
                  const m = MODES[o.mode];
                  return (
                    <li key={o.id} className="carte p-4 text-sm">
                      <p className="font-semibold text-marine-900">{m.icone} {m.label}</p>
                      <p className="text-slate-600">{PAYS[o.origine_pays].drapeau} {o.origine_ville} → Gabon</p>
                      <p className="mt-2 text-xl font-extrabold text-marine-900">{fcfa(o.prix_xaf)} <span className="text-sm font-semibold">{UNITE_PRIX[m.unite]}</span></p>
                      <ul className="mt-2 space-y-0.5 text-slate-700">
                        {o.frais_fixes_xaf > 0 && <li>+ {fcfa(o.frais_fixes_xaf)} de frais fixes par envoi</li>}
                        {o.minimum > 0 && m.unite !== "conteneur" && m.unite !== "vehicule" && <li>Minimum : {nombre(o.minimum)} {m.unite === "kg" ? "kg" : "m³"}</li>}
                        <li>Délai annoncé : {o.delai_min}–{o.delai_max} jours</li>
                        {o.prochain_depart && <li>Prochain départ : {dateFr(o.prochain_depart)}</li>}
                        <li>{o.dedouanement_inclus ? "✔ Dédouanement inclus" : "✖ Dédouanement non inclus"}</li>
                        <li>{LIVRAISON[o.livraison]}{o.livraison === "tout_gabon" && o.villes_desservies.length ? ` (${o.villes_desservies.join(", ")})` : ""}</li>
                      </ul>
                      <p className="mt-2 text-xs text-slate-500">Accepte : {o.marchandises.map((x) => MARCHANDISES[x]?.label ?? x).join(" · ")}</p>
                      {o.inclus && <p className="mt-1 text-xs"><span className="font-semibold text-verifie-600">Inclus :</span> {o.inclus}</p>}
                      {o.non_inclus && <p className="text-xs"><span className="font-semibold text-alerte-600">Non inclus :</span> {o.non_inclus}</p>}
                      <p className="mt-2 text-xs text-slate-400">Tarif vérifié le {dateFr(o.validated_at)}</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-lg font-bold text-marine-900">Avis vérifiés ({avis.length})</h2>
            <p className="text-xs text-slate-500">Seuls les clients mis en relation via Neam Transit peuvent noter. Chaque avis est modéré.</p>
            {avis.length === 0 ? (
              <p className="carte mt-3 p-5 text-sm text-slate-600">Pas encore d&apos;avis.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {avis.map((a) => {
                  const note = (a.note_prix + a.note_delai + a.note_etat + a.note_service) / 4;
                  const j = Math.round((Date.parse(a.date_reception) - Date.parse(a.date_remise)) / 86400000);
                  return (
                    <li key={a.id} className="carte p-4 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-slate-800">{a.nom}</p>
                        <Etoiles note={note} />
                      </div>
                      <p className="text-xs text-slate-500">
                        {a.famille === "aerien" ? "✈️ Aérien" : "🚢 Maritime"} · reçu en {j} jours · {dateFr(a.date_reception)}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">Prix {a.note_prix}/5 · Délai {a.note_delai}/5 · État {a.note_etat}/5 · Service {a.note_service}/5</p>
                      {a.commentaire && <p className="mt-2 text-slate-700">{a.commentaire}</p>}
                      {a.reponse && a.reponse_statut === "publie" && (
                        <p className="mt-2 rounded-lg bg-marine-50 p-3 text-slate-700"><span className="font-semibold">Réponse du transitaire :</span> {a.reponse}</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:h-fit">
          <div className="carte p-5">
            <h2 className="font-bold text-marine-900">Contacter {t.nom}</h2>
            <div className="mt-3 grid gap-2">
              <a href={`/go/${t.id}?canal=whatsapp`} className="btn-whatsapp" rel="nofollow">Écrire sur WhatsApp</a>
              <a href={`/go/${t.id}?canal=appel`} className="btn-contour" rel="nofollow">Appeler {afficherTelephone(t.telephone)}</a>
              <Link href={`/devis?t=${t.slug}`} className="btn-marine">Demander un devis</Link>
            </div>
            <p className="mt-3 text-xs text-slate-500">Paiement directement au transitaire : {t.modes_paiement || "à convenir"}.</p>
          </div>
          <div className="carte p-5 text-sm">
            <h2 className="font-bold text-marine-900">Coordonnées vérifiées</h2>
            <p className="mt-2 text-slate-700">{t.adresse}, {t.ville}</p>
            {t.entrepots.length > 0 && (
              <>
                <p className="mt-3 font-semibold text-slate-800">Entrepôts / partenaires</p>
                <ul className="mt-1 space-y-1 text-slate-700">
                  {t.entrepots.map((e, i) => (
                    <li key={i}>{PAYS[e.pays]?.drapeau} {e.ville} — {e.adresse}</li>
                  ))}
                </ul>
              </>
            )}
            {t.marchandises_refusees.length > 0 && (
              <p className="mt-3 text-slate-700"><span className="font-semibold">Refuse :</span> {t.marchandises_refusees.map((m) => MARCHANDISES[m]?.label ?? m).join(", ")}</p>
            )}
          </div>
          <Alerte type="attention">Ne payez qu&apos;aux coordonnées affichées sur cette fiche. Un doute ? Contactez Neam Transit.</Alerte>
        </aside>
      </div>
    </div>
  );
}
