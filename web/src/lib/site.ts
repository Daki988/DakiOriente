/** Adresse publique du site (référencement, liens absolus). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.URL ?? "https://navigoal.netlify.app").replace(/\/$/, "");
