import type { Metadata } from "next";
import Link from "next/link";
import { demanderCode, validerCode } from "@/lib/actions/pro";
import { afficherTelephone } from "@/lib/format";
import { premier, type SP } from "@/lib/recherche";
import { Alerte } from "@/components/ui";

export const metadata: Metadata = { title: "Connexion transitaire", robots: { index: false } };

export default async function Connexion({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const tel = premier(sp.tel).replace(/\D/g, "");
  const erreur = premier(sp.erreur);
  const dev = premier(sp.dev);
  return (
    <div className="conteneur max-w-md py-10">
      <h1 className="titre-page">Espace transitaire</h1>
      {erreur && <div className="mt-4"><Alerte type="erreur">{erreur}</Alerte></div>}
      {!tel ? (
        <form action={demanderCode} className="carte mt-6 grid gap-4 p-5">
          <div>
            <label className="etiquette" htmlFor="telephone">Votre numéro de téléphone</label>
            <input id="telephone" name="telephone" type="tel" required className="champ" placeholder="077 12 34 56" autoComplete="tel" />
          </div>
          <button className="btn-primaire" type="submit">Recevoir un code</button>
          <p className="text-sm text-slate-600">Pas encore référencé ? <Link className="underline" href="/pro/inscription">Créer ma fiche</Link></p>
        </form>
      ) : (
        <form action={validerCode} className="carte mt-6 grid gap-4 p-5">
          <input type="hidden" name="telephone" value={tel} />
          <p className="text-sm text-slate-700">Si ce numéro est enregistré, un code a été envoyé au <strong>{afficherTelephone(tel)}</strong>.</p>
          {dev && <Alerte type="attention">Mode développement — code : <strong>{dev}</strong></Alerte>}
          <div>
            <label className="etiquette" htmlFor="code">Code à 6 chiffres</label>
            <input id="code" name="code" required inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="one-time-code" className="champ text-center text-2xl tracking-[0.5em]" />
          </div>
          <button className="btn-primaire" type="submit">Se connecter</button>
          <Link className="text-sm text-marine-700 underline" href="/pro/connexion">Changer de numéro</Link>
        </form>
      )}
    </div>
  );
}
