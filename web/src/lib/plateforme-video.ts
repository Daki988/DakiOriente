/** Nom de la plateforme d'une vidéo intégrée (lecteurs officiels autorisés dans la CSP de next.config.mjs). */
export const plateforme = (video: string) => (video.includes("youtube") ? "YouTube" : video.includes("onisep") ? "Onisep TV" : "la plateforme d'origine");
