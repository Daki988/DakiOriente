import { MARCHANDISES, MODES, PAYS, type MarchandiseCode, type ModeCode, type PaysCode } from "./referentiel";
import { nombre } from "./format";

export function messageContact(p: {
  pays: PaysCode;
  ville?: string | null;
  destination: string;
  mode?: ModeCode | null;
  marchandise: MarchandiseCode;
  poids?: number | null;
  volume?: number | null;
  quantite?: number | null;
  ref?: string;
}): string {
  const depart = `${p.ville ? p.ville + ", " : ""}${PAYS[p.pays].nom}`;
  const qte = [
    p.poids ? `${nombre(p.poids)} kg` : null,
    p.volume ? `${nombre(p.volume)} m³` : null,
    p.mode && (MODES[p.mode].unite === "conteneur" || MODES[p.mode].unite === "vehicule") && p.quantite ? `${p.quantite} ${MODES[p.mode].unite === "conteneur" ? "conteneur(s)" : "véhicule(s)"}` : null,
  ]
    .filter(Boolean)
    .join(" / ");
  return [
    "Bonjour, je vous ai trouvé sur Neam Transit.",
    `Je souhaite envoyer : ${MARCHANDISES[p.marchandise].label.toLowerCase()}`,
    `Départ : ${depart} → Arrivée : ${p.destination} (Gabon)`,
    p.mode ? `Mode : ${MODES[p.mode].label}` : null,
    qte ? `Quantité : ${qte}` : null,
    p.ref ? `Référence Neam Transit : ${p.ref}` : null,
    "Pouvez-vous me confirmer le prix total, ce qui est inclus et la prochaine date de départ ? Merci.",
  ]
    .filter(Boolean)
    .join("\n");
}
