import { useEffect, useState } from "react";
import type { SaisieAdresse } from "../../src/index.ts";
import { Accueil } from "./screens/Accueil.tsx";
import { Creer } from "./screens/Creer.tsx";
import { ecrire, lire, type Enregistrement } from "./stockage.ts";

type Vue = "accueil" | "creer";

export function App() {
  const [vue, setVue] = useState<Vue>("accueil");
  const [adresses, setAdresses] = useState<Enregistrement[]>(lire);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const enregistrer = (saisie: SaisieAdresse, vocal?: string) => {
    const nouvelle: Enregistrement = { id: crypto.randomUUID(), libelle: "Mon adresse", saisie, vocal, creeLe: new Date().toISOString() };
    // la nouvelle adresse devient « Mon adresse », l'ancienne passe dans la liste
    const suivantes = [nouvelle, ...adresses.map((a, i) => (i === 0 ? { ...a, libelle: "Ancienne adresse" } : a))];
    if (!ecrire(suivantes) && vocal) {
      // stockage plein : on garde l'adresse sans la note vocale
      suivantes[0] = { ...nouvelle, vocal: undefined };
      ecrire(suivantes);
      setToast("Adresse enregistrée (note vocale trop lourde)");
    } else {
      setToast("Adresse enregistrée ✓");
    }
    setAdresses(suivantes);
    setVue("accueil");
  };

  return (
    <>
      {vue === "accueil" ? (
        <Accueil adresses={adresses} onCreer={() => setVue("creer")} />
      ) : (
        <Creer onRetour={() => setVue("accueil")} onValider={enregistrer} />
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}
