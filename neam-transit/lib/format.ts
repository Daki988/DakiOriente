export function fcfa(n: number): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(n)).replace(/ | /g, " ") + " FCFA";
}

export function nombre(n: number, dec = 2): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: dec }).format(n).replace(/ | /g, " ");
}

export function dateFr(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? iso + "T12:00:00Z" : iso.replace(" ", "T") + (iso.includes("Z") ? "" : "Z"));
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Libreville" });
}

/** Normalise un numéro gabonais ou international en chiffres seuls avec indicatif (ex. 24177123456). */
export function normaliserTelephone(input: string): string | null {
  let d = input.replace(/[^\d+]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  else if (d.startsWith("00")) d = d.slice(2);
  else if (!d.startsWith("241")) d = "241" + (d.startsWith("0") && d.length === 9 ? d.slice(1) : d);
  if (!/^\d{9,15}$/.test(d)) return null;
  return d;
}

export function afficherTelephone(d: string): string {
  if (d.startsWith("241")) {
    const local = d.slice(3);
    return "+241 " + local.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
  }
  return "+" + d;
}

export function lienWhatsApp(telephone: string, message: string): string {
  return `https://wa.me/${telephone}?text=${encodeURIComponent(message)}`;
}

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3100").replace(/\/$/, "");
