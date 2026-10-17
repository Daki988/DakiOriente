export const STEPS = ["Reçue", "BAT validé", "En impression", "Prête", "Livrée"] as const;
export const NEXT_ACTION = ["Valider le BAT", "Lancer l’impression", "Marquer comme prête", "Marquer comme livrée"] as const;
export const LAST_STEP = STEPS.length - 1;

/** Classes de pastille par étape (fond + texte). */
export const STEP_STYLE = [
  "bg-info-soft text-info",
  "bg-brand-soft text-brand",
  "bg-warn-soft text-warn",
  "bg-ok-soft text-ok",
  "bg-line text-muted",
] as const;

export const PAYMENT_METHODS = ["Airtel Money", "Moov Money", "Espèces"] as const;
