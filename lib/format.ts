export const fcfa = (n: number) =>
  `${Math.round(n).toLocaleString("fr-FR").replace(/[  ]/g, " ")} FCFA`;

export const dateFr = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", {
    timeZone: "Africa/Libreville",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export const unitLabel = (unit: string, n: number) =>
  unit === "ex." ? `${n.toLocaleString("fr-FR")} ex.` : unit === "m²" ? `${n} m²` : `${n} ${unit}${n > 1 && unit !== "m²" ? "s" : ""}`;
