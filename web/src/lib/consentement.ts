// Consentement aux cookies non indispensables (novembre 2026) : mesure d'audience Google Analytics, chargée par
// Google Tag Manager, et cookie de campagne ng_acq. Un seul choix, demandé à tous les visiteurs par le bandeau
// (components/campagne/AcquisitionTracker.tsx), modifiable sur /cookies. Tant qu'il n'est pas donné, Google reçoit
// les visites en « mode consentement » refusé : aucun cookie Google, aucune donnée publicitaire.
export const GTM_ID = "GTM-W82DZ8B3"; // conteneur remplacé le 19/11/2026 (ancien : GTM-NXWJQLQD) ; envoie vers G-RX3WM6XB98
/** Balise Google (Google Analytics G-G63G8RQJTE) installée directement, en plus du conteneur (19/11/2026). */
export const BALISE_GOOGLE_ID = "G-G63G8RQJTE";
/** Toutes les balises chargées par https://www.googletagmanager.com/gtm.js?id=… */
export const BALISES_GOOGLE = [GTM_ID, BALISE_GOOGLE_ID];
/** Nouvelle clé : l'ancien accord (« navigoal-cookies ») ne couvrait que le cookie de campagne. */
export const CLE_CHOIX_COOKIES = "navigoal-cookies-2";
export const EVENEMENT_CONSENTEMENT = "navigoal-consentement";

export const lireChoix = () => { try { return localStorage.getItem(CLE_CHOIX_COOKIES); } catch { return null; } };

type Gtag = (...args: unknown[]) => void;
/** Enregistre le choix et le transmet à Google (analytics_storage) ; la publicité reste toujours refusée. */
export function enregistrerChoix(oui: boolean) {
  try { localStorage.setItem(CLE_CHOIX_COOKIES, oui ? "oui" : "non"); } catch { /* stockage indisponible */ }
  const g = (window as unknown as { gtag?: Gtag }).gtag;
  g?.("consent", "update", { analytics_storage: oui ? "granted" : "denied" });
  if (!oui) {
    // Effacer les cookies Google Analytics déjà posés (_ga, _ga_XXXX) sur le domaine et ses parents.
    const hotes = [location.hostname, `.${location.hostname.replace(/^www\./, "")}`];
    for (const c of document.cookie.split("; ")) {
      const nom = c.split("=")[0];
      if (/^_ga(_|$)|^_gid$/.test(nom)) for (const d of hotes) document.cookie = `${nom}=; Max-Age=0; Path=/; Domain=${d}`;
    }
  }
  window.dispatchEvent(new Event(EVENEMENT_CONSENTEMENT));
}

/** Script exécuté avant Google Tag Manager : consentement refusé par défaut, puis le choix déjà enregistré. */
export const SCRIPT_CONSENTEMENT = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',functionality_storage:'granted',security_storage:'granted',wait_for_update:500});
try{if(localStorage.getItem('${CLE_CHOIX_COOKIES}')==='oui')gtag('consent','update',{analytics_storage:'granted'});}catch(e){}
gtag('js',new Date());
dataLayer.push({'gtm.start':new Date().getTime(),event:'gtm.js'});`;
