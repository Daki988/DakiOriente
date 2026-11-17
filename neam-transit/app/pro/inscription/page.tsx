import type { Metadata } from "next";
import Link from "next/link";
import { inscrireTransitaire } from "@/lib/actions/pro";
import { premier, type SP } from "@/lib/recherche";
import { PROVINCES } from "@/lib/referentiel";
import { Alerte } from "@/components/ui";
import { CasesMarchandises, ChampsEntrepots } from "@/components/ChampsPro";

export const metadata: Metadata = { title: "Référencer mon entreprise" };

const DOCS = [
  ["rccm", "Extrait RCCM", true],
  ["identite", "Pièce d'identité du gérant", true],
  ["agrement", "Agrément de commissionnaire en douane", false],
  ["entrepot", "Preuve d'entrepôt / contrat avec un partenaire en Chine ou en Corée", false],
] as const;

export default async function Inscription({ searchParams }: { searchParams: Promise<SP> }) {
  const erreur = premier((await searchParams).erreur);
  return (
    <div className="conteneur max-w-3xl py-8">
      <h1 className="titre-page">Référencer mon entreprise</h1>
      <p className="mt-2 text-sm text-slate-600">Votre fiche sera publiée après vérification de vos documents. Gratuit.</p>
      {erreur && <div className="mt-4"><Alerte type="erreur">{erreur}</Alerte></div>}
      <form action={inscrireTransitaire} className="carte mt-6 grid gap-5 p-5 sm:p-6">
        <input type="text" name="site" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
        <h2 className="font-semibold text-marine-900">Entreprise</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="etiquette" htmlFor="nom">Nom commercial *</label><input id="nom" name="nom" required maxLength={100} className="champ" /></div>
          <div><label className="etiquette" htmlFor="gerant">Nom du gérant *</label><input id="gerant" name="gerant" required maxLength={100} className="champ" /></div>
          <div><label className="etiquette" htmlFor="rccm">N° RCCM *</label><input id="rccm" name="rccm" required maxLength={60} className="champ" /></div>
          <div><label className="etiquette" htmlFor="nif">NIF *</label><input id="nif" name="nif" required maxLength={60} className="champ" /></div>
          <div><label className="etiquette" htmlFor="agrement">N° d&apos;agrément en douane</label><input id="agrement" name="agrement" maxLength={60} className="champ" placeholder="Si vous en avez un" /></div>
          <div>
            <label className="etiquette" htmlFor="ville">Ville de l&apos;agence *</label>
            <select id="ville" name="ville" required className="champ" defaultValue="Libreville">
              {PROVINCES.map((p) => <optgroup key={p.province} label={p.province}>{p.villes.map((v) => <option key={v}>{v}</option>)}</optgroup>)}
            </select>
          </div>
          <div className="sm:col-span-2"><label className="etiquette" htmlFor="adresse">Adresse de l&apos;agence *</label><input id="adresse" name="adresse" required maxLength={300} className="champ" placeholder="Quartier, rue, repère" /></div>
          <div><label className="etiquette" htmlFor="telephone">Téléphone (connexion) *</label><input id="telephone" name="telephone" type="tel" required className="champ" placeholder="077 12 34 56" /></div>
          <div><label className="etiquette" htmlFor="whatsapp">WhatsApp (si différent)</label><input id="whatsapp" name="whatsapp" type="tel" className="champ" /></div>
          <div className="sm:col-span-2"><label className="etiquette" htmlFor="email">E-mail</label><input id="email" name="email" type="email" maxLength={120} className="champ" /></div>
          <div className="sm:col-span-2">
            <label className="etiquette" htmlFor="description">Présentation</label>
            <textarea id="description" name="description" rows={3} maxLength={1000} className="champ" placeholder="Vos spécialités, fréquence des départs, services…" />
          </div>
          <div className="sm:col-span-2">
            <label className="etiquette" htmlFor="modes_paiement">Modes de paiement acceptés (information pour vos clients)</label>
            <input id="modes_paiement" name="modes_paiement" maxLength={200} className="champ" placeholder="Espèces, Airtel Money, Moov Money, virement…" />
          </div>
        </div>
        <ChampsEntrepots />
        <CasesMarchandises name="refusees" legende="Marchandises que vous refusez" />
        <fieldset>
          <legend className="font-semibold text-marine-900">Justificatifs (PDF ou photo, 5 Mo max chacun)</legend>
          <div className="mt-3 grid gap-3">
            {DOCS.map(([k, l, req]) => (
              <div key={k}>
                <label className="etiquette" htmlFor={`doc_${k}`}>{l}{req ? " *" : ""}</label>
                <input id={`doc_${k}`} name={`doc_${k}`} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" required={req} className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-marine-100 file:px-3 file:py-2 file:font-semibold file:text-marine-900" />
              </div>
            ))}
          </div>
          <p className="aide">Ces documents ne sont jamais publiés : ils servent uniquement à la vérification.</p>
        </fieldset>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" name="engagement" required className="mt-1 h-5 w-5 accent-marine-900" />
          Je certifie l&apos;exactitude de ces informations et j&apos;accepte que mes tarifs et avis clients soient publiés après vérification. <Link href="/conditions" className="underline">Conditions</Link>
        </label>
        <button type="submit" className="btn-primaire text-base">Envoyer pour vérification</button>
      </form>
    </div>
  );
}
