import { exigerPro } from "@/lib/auth";
import { modifierProfil } from "@/lib/actions/pro";
import { getTransitaire } from "@/lib/queries";
import { premier, type SP } from "@/lib/recherche";
import { afficherTelephone } from "@/lib/format";
import { Alerte } from "@/components/ui";
import { CasesMarchandises, ChampsEntrepots } from "@/components/ChampsPro";
import { pret } from "@/lib/stockage";

export const metadata = { title: "Mon profil", robots: { index: false } };

export default async function Profil({ searchParams }: { searchParams: Promise<SP> }) {
  const id = await exigerPro();
  await pret();
  const t = getTransitaire(id)!;
  const v = t.modif_en_attente ?? t;
  const erreur = premier((await searchParams).erreur);
  return (
    <div className="conteneur max-w-3xl py-8">
      <h1 className="titre-page">Mon profil</h1>
      <p className="mt-2 text-sm text-slate-600">
        Nom, RCCM, NIF et téléphone de connexion ({afficherTelephone(t.telephone)}) ne se modifient qu&apos;en contactant Neam Transit. Les autres changements sont vérifiés avant publication.
      </p>
      {t.modif_en_attente && <div className="mt-4"><Alerte type="attention">Des modifications sont déjà en attente de vérification ; un nouvel envoi les remplacera.</Alerte></div>}
      {erreur && <div className="mt-4"><Alerte type="erreur">{erreur}</Alerte></div>}
      <form action={modifierProfil} className="carte mt-6 grid gap-5 p-5 sm:p-6">
        <div><label className="etiquette" htmlFor="description">Présentation</label><textarea id="description" name="description" rows={3} maxLength={1000} className="champ" defaultValue={v.description} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="etiquette" htmlFor="adresse">Adresse de l&apos;agence</label><input id="adresse" name="adresse" maxLength={300} className="champ" defaultValue={v.adresse} /></div>
          <div><label className="etiquette" htmlFor="whatsapp">WhatsApp</label><input id="whatsapp" name="whatsapp" type="tel" className="champ" defaultValue={v.whatsapp ?? ""} /></div>
          <div><label className="etiquette" htmlFor="email">E-mail</label><input id="email" name="email" type="email" className="champ" defaultValue={v.email ?? ""} /></div>
          <div><label className="etiquette" htmlFor="modes_paiement">Modes de paiement acceptés</label><input id="modes_paiement" name="modes_paiement" maxLength={200} className="champ" defaultValue={v.modes_paiement} /></div>
        </div>
        <ChampsEntrepots valeurs={v.entrepots} />
        <CasesMarchandises name="refusees" legende="Marchandises refusées" valeurs={v.marchandises_refusees} />
        <button className="btn-primaire" type="submit">Envoyer pour vérification</button>
      </form>
    </div>
  );
}
