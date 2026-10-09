"use client";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { DOC_TYPES } from "@/components/app/form";
import type { Tone } from "@/components/app/kit";

// ---------------------------------------------------------------- Types renvoyés par l'API
export type Etab = {
  id: string; nom: string; sigle: string; pays: string; ville: string; type: string; typeLibelle: string; statut: string;
  siteWeb: string | null; anneeCreation: number | null; description: string | null; email: string | null; phone: string | null;
  logo: string | null; photos: { src: string; credit: string | null; licence: string | null; page: string | null }[];
  status: "importe" | "revendique" | "verifie" | "suspendu"; featured: boolean; plan: string; updatedAt: string;
};
export type Membership = { e: Etab; role: string };

export type Program = {
  id: string; establishmentId: string; formationId: string; title: string; description: string | null; durationYears: number | null; language: string | null;
  faculty: string; campus: string | null; diploma: string | null; level: string | null; options: string | null;
  homologated: boolean; homologation: { statut: string; fin?: string; texte?: string } | null;
  tuitionMin: number | null; tuitionMax: number | null; currency: string | null; feesConfirmed: boolean; applicationFee: number;
  admission: { series?: string[]; noteMin?: number; concours?: boolean; entretien?: boolean; prerequis?: string };
  requiredDocuments: string[]; seats: number | null; startDate: string | null; active: boolean; indicative: boolean; updatedAt: string;
};

export type Campaign = {
  id: string; establishmentId: string; kind: CampaignKind; title: string; description: string | null; programIds: string[]; startsAt: string; endsAt: string;
  seats: number | null; conditions: string | null; requiredDocuments: string[]; published: boolean; updatedAt: string;
};
export type CampaignKind = "admission" | "concours" | "inscription" | "bourse" | "portes_ouvertes" | "evenement";

export type AppStatus = "brouillon" | "soumise" | "paiement_confirme" | "en_verification" | "complet" | "en_traitement" | "piece_demandee" | "acceptee" | "refusee" | "liste_attente" | "desistee";
export type AppRow = {
  a: { id: string; number: string; status: AppStatus; programId: string; documentIds: string[]; submittedAt: string | null; updatedAt: string };
  p: Program;
  s: { id: string; firstName: string; lastName: string; country: string | null; city: string | null; email: string | null; phone: string | null };
};

// ---------------------------------------------------------------- Référentiels d'affichage
export const PAYS_LABEL: Record<string, string> = { GA: "Gabon", MA: "Maroc", SN: "Sénégal" };
export const PAYS_COLOR: Record<string, string> = { MA: "#6a3df0", SN: "#1a47f5", GA: "#0f8a46" };
export const paysLabel = (c: string | null | undefined) => (c ? PAYS_LABEL[c] ?? c : "Non renseigné");

/** Pièces qu'un établissement peut exiger (hors pièces bailleur). */
export const SCHOOL_DOC_TYPES = DOC_TYPES;

/** Transitions autorisées côté établissement — miroir de SCHOOL_TRANSITIONS (server/services/applications.ts). */
export const SCHOOL_TRANSITIONS: Partial<Record<AppStatus, AppStatus[]>> = {
  soumise: ["en_verification", "piece_demandee", "refusee"],
  paiement_confirme: ["en_verification", "piece_demandee", "refusee"],
  en_verification: ["complet", "piece_demandee", "refusee"],
  piece_demandee: ["en_verification", "refusee"],
  complet: ["en_traitement", "acceptee", "refusee", "liste_attente"],
  en_traitement: ["acceptee", "refusee", "liste_attente"],
  liste_attente: ["acceptee", "refusee"],
};
/** Statuts « à traiter » (dossier en attente d'une action de l'établissement). */
export const TODO_STATUSES: AppStatus[] = ["soumise", "paiement_confirme", "en_verification", "complet", "en_traitement"];

export const CAMPAIGN_KINDS: [CampaignKind, string][] = [
  ["admission", "Admission"], ["concours", "Concours d'entrée"], ["inscription", "Inscription"], ["bourse", "Bourse"], ["portes_ouvertes", "Portes ouvertes"], ["evenement", "Événement"],
];
export const campaignKindLabel = (k: string) => CAMPAIGN_KINDS.find(([v]) => v === k)?.[1] ?? k;

export const ETAB_STATUS: Record<Etab["status"], { label: string; tone: Tone; text: string }> = {
  importe: { label: "Fiche importée", tone: "grey", text: "Cette fiche a été créée à partir des sources publiques. Complétez-la pour la revendiquer." },
  revendique: { label: "En cours de vérification", tone: "sun", text: "Votre fiche est revendiquée : l'équipe Navigoal vérifie vos informations (agrément, représentant légal)." },
  verifie: { label: "Établissement vérifié", tone: "green", text: "Le badge « Établissement vérifié » est affiché sur votre page publique et vos formations." },
  suspendu: { label: "Fiche suspendue", tone: "rose", text: "Votre fiche n'est plus visible. Contactez l'équipe Navigoal pour la réactiver." },
};

export const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);
export const octets = (n: number) => (n < 1024 ? `${n} o` : n < 1024 * 1024 ? `${Math.round(n / 1024)} Ko` : `${(n / 1024 / 1024).toFixed(1).replace(".", ",")} Mo`);

/** Supprime les valeurs nulles (les schémas zod de l'API attendent des champs absents plutôt que null). */
export function clean<T extends Record<string, unknown>>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== undefined && v !== "")) as Partial<T>;
}

// ---------------------------------------------------------------- Petits composants
export function Toggle({ checked, onChange, label, disabled, size = "md" }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean; size?: "sm" | "md" }) {
  const w = size === "sm" ? "h-6 w-10" : "h-7 w-12";
  const k = size === "sm" ? 18 : 22;
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
      className={`relative inline-flex shrink-0 items-center rounded-full p-[3px] transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100 disabled:opacity-50 ${w} ${checked ? "bg-[#6a3df0]" : "bg-[#dfe4f2]"}`}>
      <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 32 }} className="rounded-full bg-white shadow" style={{ width: k, height: k, marginLeft: checked ? "auto" : 0 }} />
    </button>
  );
}

export function CountryTag({ code }: { code: string | null | undefined }) {
  if (!code) return <span className="text-xs text-ink-mute">—</span>;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-mute">
      <span className="rounded px-1 text-[10px] font-extrabold text-white" style={{ background: PAYS_COLOR[code] ?? "#6b7493" }}>{code}</span>{paysLabel(code)}
    </span>
  );
}

export function SubTitle({ icon, children, action }: { icon?: ReactNode; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 className="flex items-center gap-2.5 text-[15px] font-extrabold">
        {icon && <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f1edff] text-[#6a3df0]">{icon}</span>}{children}
      </h3>
      {action}
    </div>
  );
}

/** Choix multiple sous forme de pastilles. */
export function ChipPicker({ options, value, onChange, label }: { options: [string, string][]; value: string[]; onChange: (v: string[]) => void; label: string }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {options.map(([v, l]) => {
        const on = value.includes(v);
        return (
          <button key={v} type="button" aria-pressed={on} onClick={() => onChange(on ? value.filter((x) => x !== v) : [...value, v])}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${on ? "border-[#6a3df0] bg-[#f1edff] text-[#6a3df0]" : "border-slate-200 bg-white text-ink-soft hover:border-[#b9a6fb]"}`}>
            {l}{on && " ✓"}
          </button>
        );
      })}
    </div>
  );
}
