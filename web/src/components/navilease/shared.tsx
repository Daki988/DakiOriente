"use client";
// Navilease : types, libellés et petits composants partagés (recherche, fiche, réservation, espace bailleur).
import {
  Armchair, BadgeCheck, Bath, Bike, Building2, Car, CookingPot, Droplets, Flame, Footprints, House, Laptop, ParkingCircle, ShieldCheck, Snowflake, Star, TrainFront, Users, WashingMachine, Wifi, Zap, type LucideIcon,
} from "lucide-react";
import { etabById } from "@/lib/data";

export type Verification = "non_verifie" | "identite" | "visite" | "partenaire";
export type Near = { id: string; minutes: number; mode: string };
export type Housing = {
  id: string; landlordId: string; title: string; type: string; description: string; pays: string; ville: string; quartier: string | null; address?: string | null;
  lat: number | null; lng: number | null; rent: number; charges: number; deposit: number; currency: string; surface: number | null; rooms: number | null; capacity: number;
  gender: string; furnished: boolean; amenities: string[]; rules: string | null; minMonths: number; availableFrom: string | null; nearEstablishments: Near[]; photos: string[];
  status: string; verification: Verification; moderationNote: string | null; createdAt: string; updatedAt: string; rating?: number | null; reviews?: number;
};
export type Booking = {
  id: string; number: string; housingId: string; tenantId: string; landlordId: string; guarantorId: string | null; guarantorApprovedAt: string | null; status: string;
  startDate: string; months: number; rent: number; charges: number; deposit: number; serviceFee: number; currency: string; message: string | null; documentIds: string[];
  contract: { tenantSignedAt?: string; landlordSignedAt?: string } | null; checkIn: { at: string; notes?: string } | null; checkOut: { at: string; notes?: string; retenue?: number } | null;
  createdAt: string; updatedAt: string;
};
export type Payment = { id: string; reference: string; payerId: string; kind: string; amount: number; currency: string; method: string; status: string; escrow: string; meta: Record<string, unknown>; paidAt: string | null; releasedAt: string | null; createdAt: string };
export type BookingRow = { b: Booking; h: { id: string; title: string; ville: string; quartier: string | null; photos: string[] } };

export const VERIF: Record<Verification, { label: string; short: string; cls: string; Icon: LucideIcon }> = {
  non_verifie: { label: "Non vérifié", short: "Non vérifié", cls: "bg-[#eef1f8] text-ink-soft", Icon: ShieldCheck },
  identite: { label: "Identité vérifiée", short: "Identité", cls: "bg-brand-50 text-brand-700", Icon: BadgeCheck },
  visite: { label: "Visité par Navilease", short: "Visité", cls: "bg-[#e8f8ef] text-[#0f8a46]", Icon: BadgeCheck },
  partenaire: { label: "Partenaire certifié", short: "Partenaire", cls: "bg-sun-100 text-[#a55a00]", Icon: Star },
};
export function VerifBadge({ v, className = "" }: { v: Verification; className?: string }) {
  const x = VERIF[v] ?? VERIF.non_verifie;
  return <span className={`chip ${x.cls} ${className}`}><x.Icon size={13} aria-hidden />{x.label}</span>;
}

export const TYPES: [string, string][] = [["studio", "Studio"], ["chambre", "Chambre"], ["colocation", "Colocation"], ["appartement", "Appartement"], ["residence", "Résidence étudiante"], ["chez_habitant", "Chez l'habitant"]];
export const typeLabel = (t: string) => TYPES.find(([k]) => k === t)?.[1] ?? t;
export const GENDERS: [string, string][] = [["mixte", "Mixte"], ["filles", "Filles"], ["garcons", "Garçons"]];
export const genderLabel = (g: string) => GENDERS.find(([k]) => k === g)?.[1] ?? g;
export const MODES: [string, string][] = [["pied", "à pied"], ["transport", "en transport"], ["voiture", "en voiture"]];
export const modeLabel = (m: string) => MODES.find(([k]) => k === m)?.[1] ?? m;
/** Navilease : logements étudiants au Maroc. */
export const PAYS: [string, string][] = [["MA", "Maroc"]];
export const COUNTRY_OF_CURRENCY: Record<string, string> = { XAF: "GA", MAD: "MA", XOF: "SN" };
export const CURRENCY_OF_COUNTRY: Record<string, string> = { GA: "XAF", MA: "MAD", SN: "XOF" };

export const AMENITIES: { id: string; label: string; Icon: LucideIcon }[] = [
  { id: "meuble", label: "Meublé", Icon: Armchair }, { id: "wifi", label: "Wifi", Icon: Wifi }, { id: "eau", label: "Eau courante", Icon: Droplets },
  { id: "electricite", label: "Électricité incluse", Icon: Zap }, { id: "groupe_electrogene", label: "Groupe électrogène", Icon: Flame }, { id: "climatisation", label: "Climatisation", Icon: Snowflake },
  { id: "cuisine", label: "Cuisine équipée", Icon: CookingPot }, { id: "machine_a_laver", label: "Lave-linge", Icon: WashingMachine }, { id: "gardiennage", label: "Gardiennage", Icon: ShieldCheck },
  { id: "parking", label: "Parking", Icon: ParkingCircle }, { id: "bureau", label: "Espace de travail", Icon: Laptop }, { id: "eau_chaude", label: "Eau chaude", Icon: Bath },
];
export const amenity = (id: string) => AMENITIES.find((a) => a.id === id) ?? { id, label: id, Icon: House };
export const MODE_ICON: Record<string, LucideIcon> = { pied: Footprints, transport: TrainFront, voiture: Car, velo: Bike };

/** Nom court d'un établissement du catalogue. */
export const etabName = (id: string) => { const e = etabById[id]; return e ? (e.sigle && e.sigle.length <= 18 ? e.sigle : e.nom) : id; };
export const nearText = (n: Near) => `${n.minutes} min ${modeLabel(n.mode)} de ${etabName(n.id)}`;

/** Photos d'annonce : clés « housings/<hid>/<fid> » servies par /api/fichiers/… */
export const photoUrl = (key: string) => `/api/fichiers/${key}/`;

const GRADS = ["from-brand-600 to-[#5b8cff]", "from-[#0f8a46] to-[#4ad08a]", "from-[#6a3df0] to-[#a98bff]", "from-[#e2541b] to-[#f7a24b]", "from-[#0e7490] to-[#38c6dd]"];
const TYPE_ICON: Record<string, LucideIcon> = { studio: Building2, chambre: House, colocation: Users, appartement: Building2, residence: Building2, chez_habitant: House };
export const gradFor = (seed: string) => GRADS[[...seed].reduce((a, c) => a + c.charCodeAt(0), 0) % GRADS.length];

/** Visuel d'une annonce : première photo ou dégradé illustré. */
export function Cover({ h, idx = 0, className = "", iconSize = 44, alt }: { h: Pick<Housing, "id" | "photos" | "type" | "title">; idx?: number; className?: string; iconSize?: number; alt?: string }) {
  const key = h.photos[idx];
  if (key) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photoUrl(key)} alt={alt ?? h.title} loading="lazy" className={`h-full w-full object-cover ${className}`} />;
  }
  const I = TYPE_ICON[h.type] ?? House;
  return (
    <div className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br ${gradFor(h.id + idx)} ${className}`} role="img" aria-label={alt ?? `${h.title} (photo à venir)`}>
      <span className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/10" />
      <I size={iconSize} className="text-white/80" strokeWidth={1.5} />
    </div>
  );
}

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-sun-500" aria-label={`${value.toFixed(1)} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={size} className={i <= Math.round(value) ? "fill-sun-400" : "text-slate-300"} />)}
    </span>
  );
}

// ---------------------------------------------------------------- Réservation : séquence 31.8
export const SEQUENCE: [string, string][] = [
  ["demande", "Demande envoyée"], ["acceptee", "Acceptée"], ["paiement_sequestre", "Paiement en séquestre"], ["contrat_signe", "Contrat signé"], ["entree", "Entrée dans les lieux"],
  ["fonds_verses", "Fonds versés au bailleur"], ["en_cours", "Location en cours"], ["preavis", "Préavis"], ["sortie", "Sortie (état des lieux)"], ["caution_restituee", "Caution restituée"],
];
export const BOOKING_STATUS: Record<string, string> = {
  demande: "Demande envoyée", acceptee: "Acceptée · paiement attendu", attente_garant: "En attente du garant", paiement_sequestre: "Payée · contrat à signer", contrat_signe: "Contrat signé",
  entree: "Entrée dans les lieux", fonds_verses: "Fonds versés", en_cours: "Location en cours", preavis: "Préavis donné", sortie: "Sortie", caution_restituee: "Terminée · caution restituée",
  refusee: "Refusée", annulee: "Annulée", litige: "Litige en médiation",
};
export const OPEN_REQUEST = ["demande", "attente_garant"];
export const ACTIVE = ["acceptee", "paiement_sequestre", "contrat_signe", "entree", "fonds_verses", "en_cours", "preavis"];

/** Index atteint dans la séquence (attente_garant ≈ entre demande et acceptée). */
export function seqIndex(status: string, events: { status: string }[] = []) {
  const i = SEQUENCE.findIndex(([s]) => s === status);
  if (i >= 0) return i;
  if (status === "attente_garant") return 0;
  let best = 0;
  for (const e of events) { const k = SEQUENCE.findIndex(([s]) => s === e.status); if (k > best) best = k; }
  return best;
}

export const addMonths = (iso: string, n: number) => { const d = new Date(iso + "T12:00:00"); d.setMonth(d.getMonth() + n); return d; };
export const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const monthFr = (d: Date) => d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
export const period = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

/** Conversion indicative en euros (parité fixe du franc CFA, MAD approximatif). */
export const EUR_RATE: Record<string, number> = { XAF: 655.957, XOF: 655.957, MAD: 10.8 };
export const toEur = (n: number, cur: string) => (EUR_RATE[cur] ? Math.round(n / EUR_RATE[cur]) : null);
export const SERVICE_FEE = 0.05; // frais de service Navilease (5 % du premier loyer)
