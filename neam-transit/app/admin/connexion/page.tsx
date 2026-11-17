import { connexionAdmin } from "@/lib/actions/admin";
import { premier, type SP } from "@/lib/recherche";
import { Alerte } from "@/components/ui";

export const metadata = { title: "Administration", robots: { index: false } };

export default async function ConnexionAdmin({ searchParams }: { searchParams: Promise<SP> }) {
  const erreur = premier((await searchParams).erreur);
  return (
    <div className="conteneur max-w-sm py-12">
      <h1 className="titre-page">Administration</h1>
      {erreur && <div className="mt-4"><Alerte type="erreur">Mot de passe incorrect.</Alerte></div>}
      <form action={connexionAdmin} className="carte mt-6 grid gap-4 p-5">
        <div>
          <label className="etiquette" htmlFor="motdepasse">Mot de passe</label>
          <input id="motdepasse" name="motdepasse" type="password" required className="champ" autoComplete="current-password" />
        </div>
        <button className="btn-marine" type="submit">Se connecter</button>
      </form>
    </div>
  );
}
