"use client";
import { usePathname } from "next/navigation";
import { GTM_ID } from "@/lib/consentement";

// Espaces connectés, back-office et authentification : jamais de Google Tag Manager (adresses et données personnelles).
const PRIVE = /^\/(admin|espace|etablissement|bailleur|parent|conseiller|compte|messages|notifications|appel|paiement|connexion|inscription|mot-de-passe-oublie|premiere-connexion|verification|navilease\/(espace|logements\/nouveau|reservations))(\/|$)/;

/**
 * Balise Google Tag Manager, écrite dans le HTML de la page (React la place dans le <head>) pour que les outils de
 * vérification de Google la trouvent sans exécuter la page. Chargement asynchrone : n'ajoute pas d'attente à l'affichage.
 * Le consentement refusé par défaut et l'événement de démarrage de GTM sont posés avant (SCRIPT_CONSENTEMENT).
 */
export function GoogleTagManager() {
  const path = usePathname();
  if (PRIVE.test(path)) return null;
  return <script async src={`https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`} />;
}
