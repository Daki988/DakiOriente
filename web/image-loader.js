/**
 * Loader next/image de Navigoal : pas d'optimisation à la volée (l'hébergement mutualisé n'a pas sharp),
 * mais les variantes préparées par scripts/variantes_images.py (160, 400, 640, 840 px), servies en fichiers
 * statiques. Next.js construit le srcset à partir de images.deviceSizes / imageSizes (next.config.mjs)
 * et appelle ce loader pour chaque largeur ; on renvoie la variante qui convient.
 *
 * Seules les photos de /images/ ont des variantes (contrôlées à la livraison par sync-data.mjs) :
 * tout le reste (logos, photos d'établissements, images distantes) est renvoyé tel quel.
 */
const LARGEURS = [160, 400, 640, 840];

module.exports = function loader({ src, width }) {
  if (typeof src !== "string" || !src.startsWith("/images/") || !src.endsWith(".webp")) return src;
  const taille = LARGEURS.find((l) => width <= l);
  return taille ? `${src.slice(0, -".webp".length)}-${taille}.webp` : src;
};
