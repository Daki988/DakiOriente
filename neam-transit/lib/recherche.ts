import { isMarchandise, isPays, isVilleGabon, modesPourRecherche, PAYS, type MarchandiseCode, type Transport, type TypeEnvoi } from "./referentiel";
import type { Criteres } from "./queries";

export type SP = Record<string, string | string[] | undefined>;

export const premier = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

const num = (v: string) => {
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

export function lireCriteres(sp: SP): { criteres: Criteres; valeurs: Record<string, string>; type: TypeEnvoi; tri: string } {
  const v = Object.fromEntries(Object.keys(sp).map((k) => [k, premier(sp[k])])) as Record<string, string>;
  const pays = isPays(v.pays) ? v.pays : "CN";
  const type: TypeEnvoi = v.type === "conteneur" || v.type === "vehicule" ? v.type : "groupage";
  const transport: Transport = v.transport === "avion" || v.transport === "bateau" ? v.transport : "tous";
  let marchandise: MarchandiseCode = isMarchandise(v.marchandise) ? v.marchandise : "generale";
  if (type === "vehicule") marchandise = "vehicule";
  const ville = v.ville && PAYS[pays].villes.includes(v.ville) ? v.ville : null;
  const destination = isVilleGabon(v.dest) ? v.dest : "Libreville";
  const tri = ["prix", "delai", "note"].includes(v.tri) ? v.tri : "prix";
  return {
    criteres: {
      pays,
      ville,
      destination,
      modes: modesPourRecherche(type, transport),
      marchandise,
      poids: num(v.poids ?? ""),
      volume: num(v.volume ?? ""),
      quantite: num(v.quantite ?? "") ?? 1,
    },
    valeurs: v,
    type,
    tri,
  };
}
