export const fmt = (n: number) => Math.round(n).toLocaleString("fr-FR").replace(/[\u202f\u00a0]/g, " ");
