"use client";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { GTM_ID } from "@/lib/consentement";

// Espaces connectés, back-office et authentification : jamais de Google Tag Manager (adresses et données personnelles).
const PRIVE = /^\/(admin|espace|etablissement|bailleur|parent|conseiller|compte|messages|notifications|appel|paiement|connexion|inscription|mot-de-passe-oublie|premiere-connexion|verification|navilease\/(espace|logements\/nouveau|reservations))(\/|$)/;

/** Google Tag Manager (conteneur GTM-NXWJQLQD), chargé après l'affichage de la page, sur les pages publiques. */
export function GoogleTagManager() {
  const path = usePathname();
  if (PRIVE.test(path)) return null;
  return (
    <>
      <Script id="gtm-debut" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];window.dataLayer.push({'gtm.start':Date.now(),event:'gtm.js'});`}</Script>
      <Script id="gtm" strategy="afterInteractive" src={`https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`} />
    </>
  );
}
