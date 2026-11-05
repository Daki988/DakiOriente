import detailData from "@/data/etablissements_detail.json";
import { etabById, type Etablissement, type EtablissementDetail } from "@/lib/data";

// Détail complet des établissements (filières homologuées, infos du site officiel, géolocalisation, description…),
// réservé au serveur pour ne pas alourdir le JavaScript envoyé aux visiteurs.
const D = detailData as unknown as Record<string, Omit<EtablissementDetail, keyof Etablissement> & Pick<EtablissementDetail, "filieres" | "filieres_echues" | "campus" | "site">>;

/** Fiche complète d'un établissement (identifiant actuel ou ancien identifiant de campus). */
export function etabDetail(id: string): EtablissementDetail | undefined {
  const e = etabById[id];
  return e ? ({ ...e, ...D[e.id] } as EtablissementDetail) : undefined;
}
export const etabsDetail = (ids: string[]) => ids.map(etabDetail).filter((x): x is EtablissementDetail => !!x);
