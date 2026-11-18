import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Robots admis (décisions de novembre 2026) : Google et Bing, et les robots de RECHERCHE des assistants IA, qui lisent
// une page pour répondre à une question et citer leur source (ChatGPT, Perplexity, Claude). Les robots qui collectent
// des pages pour ENTRAÎNER des modèles sont refusés, comme tous les autres. Ceux qui ignorent ce fichier sont refusés
// par le serveur (deploiement/app.js : adresses vérifiées par DNS inverse ou par les listes publiées par chaque société).
const PRIVE = ["/api/", "/espace/", "/etablissement/", "/admin/", "/parent/", "/bailleur/", "/compte/", "/conseiller/", "/messages/", "/notifications/", "/connexion", "/inscription", "/mot-de-passe-oublie", "/paiement"];
export const ROBOTS_ADMIS = ["Googlebot", "Googlebot-Image", "Googlebot-Video", "Googlebot-News", "Storebot-Google", "Google-InspectionTool", "GoogleOther", "AdsBot-Google", "Mediapartners-Google", "Bingbot", "msnbot", "BingPreview"];
export const ROBOTS_RECHERCHE_IA = ["OAI-SearchBot", "ChatGPT-User", "PerplexityBot", "Perplexity-User", "Claude-SearchBot", "Claude-User"];
/** Collecte pour l'entraînement des modèles : refusée explicitement (Google-Extended ne touche pas à Google Recherche). */
export const ROBOTS_ENTRAINEMENT = ["GPTBot", "ClaudeBot", "anthropic-ai", "CCBot", "Google-Extended", "Applebot-Extended", "Bytespider", "meta-externalagent", "Amazonbot", "cohere-ai"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: [...ROBOTS_ADMIS, ...ROBOTS_RECHERCHE_IA], allow: "/", disallow: PRIVE },
      { userAgent: ROBOTS_ENTRAINEMENT, disallow: "/" },
      { userAgent: "*", disallow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
