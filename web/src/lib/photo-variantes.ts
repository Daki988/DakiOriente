// Photos d'écoles, de villes et de résidences (/photos/…) : variantes WebP 400 et 840 px produites par
// scripts/variantes_images.py ; le JPEG d'origine (jusqu'à 1 280 px et plus) n'est chargé que sur grand écran.
const SOURCE = /^\/photos\/.+\.(jpe?g|png)$/i;

/** srcset d'une photo de /photos/, ou undefined pour une autre image (servie telle quelle). */
export function srcsetPhoto(src: string): string | undefined {
  if (!SOURCE.test(src)) return undefined;
  const base = src.replace(/\.[a-z]+$/i, "");
  return `${base}-400.webp 400w, ${base}-840.webp 840w, ${src} 1600w`;
}
