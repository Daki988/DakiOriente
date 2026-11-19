"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "@/components/ui/Link";
import { ACQ_COOKIE } from "@/lib/campagne";
import { CLE_CHOIX_COOKIES, enregistrerChoix, lireChoix } from "@/lib/consentement";

export { CLE_CHOIX_COOKIES };
const lire = () => {
  const m = document.cookie.match(new RegExp(`(?:^|; )${ACQ_COOKIE}=([^;]*)`));
  if (!m) return null;
  try { return JSON.parse(decodeURIComponent(m[1])) as { ref?: string }; } catch { return null; }
};
type Acq = { source?: string; medium?: string; campaign?: string; content?: string; ref?: string; landing: string; at: string };
const poser = (v: Acq) => {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${ACQ_COOKIE}=${encodeURIComponent(JSON.stringify(v))}; Max-Age=${90 * 86400}; Path=/; SameSite=Lax${secure}`;
};
// Pas de bandeau dans le back-office ni dans les espaces des professionnels (aucune mesure Google n'y est chargée).
const SANS_BANDEAU = /^\/(admin|etablissement|bailleur|conseiller|appel)(\/|$)/;

/**
 * Bandeau de consentement aux cookies non indispensables, montré une fois à chaque visiteur :
 *  - mesure d'audience Google Analytics (via Google Tag Manager, consentement refusé par défaut) ;
 *  - cookie de campagne ng_acq (90 jours), quand on arrive par un lien utm_… ou un code parrain (?ref=) :
 *    le serveur le lit à l'inscription.
 * Pendant l'affichage, `data-bandeau-cookies` sur <html> : la bulle de Navi s'efface sur téléphone et l'invitation
 * de Navi attend la réponse (pas de chevauchement).
 */
export function AcquisitionTracker() {
  const path = usePathname();
  const [ouvert, setOuvert] = useState(false);
  const [campagne, setCampagne] = useState<Acq | null>(null);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const ref = p.get("ref");
    const source = p.get("utm_source");
    const choix = lireChoix();
    if (ref || source) {
      const deja = lire();
      if (!deja || (ref && !deja.ref)) {
        const v: Acq = {
          source: source ?? undefined, medium: p.get("utm_medium") ?? undefined, campaign: p.get("utm_campaign") ?? undefined,
          content: p.get("utm_content") ?? undefined, ref: ref ?? undefined, landing: window.location.pathname, at: new Date().toISOString(),
        };
        if (choix === "oui") poser(v);
        else setCampagne(v);
      }
    }
    if (choix !== "oui" && choix !== "non") setOuvert(true);
  }, []);
  const visible = ouvert && !SANS_BANDEAU.test(path);
  useEffect(() => {
    if (visible) document.documentElement.dataset.bandeauCookies = "1";
    else delete document.documentElement.dataset.bandeauCookies;
  }, [visible]);
  if (!visible) return null;
  const repondre = (oui: boolean) => {
    enregistrerChoix(oui);
    if (oui && campagne) poser(campagne);
    setOuvert(false);
  };
  return (
    <div role="dialog" aria-label="Cookies" className="fixed inset-x-3 bottom-3 z-[65] mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-4 text-[13.5px] text-ink-soft shadow-[0_20px_50px_-15px_rgba(11,21,51,.35)] sm:bottom-5 print:hidden">
      <p>
        Navigoal mesure sa fréquentation avec Google Analytics pour améliorer le site. Avec votre accord, des cookies comptent les visites (aucune publicité)
        {campagne ? <>{" "}et Navigoal retient {campagne.ref ? "votre code de parrainage" : "le lien de campagne"} pendant 90 jours pour l&apos;associer à votre inscription{campagne.ref ? " et créditer votre parrain" : ""}</> : null}.{" "}
        <Link href="/cookies/" className="font-bold text-brand-600 underline-offset-2 hover:underline">En savoir plus</Link>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => repondre(true)} className="btn-primary min-h-[44px] px-4 text-[14px]">Accepter</button>
        <button type="button" onClick={() => repondre(false)} className="btn-ghost min-h-[44px] px-4 text-[14px]">Refuser</button>
      </div>
    </div>
  );
}

/** Sur la page « Politique cookies » : revoir son choix (mesure d'audience Google Analytics et cookie de campagne). */
export function ChoixCookies() {
  const [choix, setChoix] = useState<string | null>(null);
  useEffect(() => setChoix(lireChoix()), []);
  const changer = (oui: boolean) => {
    enregistrerChoix(oui);
    if (!oui) document.cookie = `${ACQ_COOKIE}=; Max-Age=0; Path=/`;
    setChoix(oui ? "oui" : "non");
  };
  return (
    <div className="not-prose my-6 flex flex-col gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 p-4 text-[14px] print:hidden">
      <b className="text-ink">Votre choix pour les cookies non indispensables (Google Analytics et cookie de campagne ng_acq)</b>
      <span className="text-ink-soft">{choix === "oui" ? "Accepté." : choix === "non" ? "Refusé : aucun cookie Google Analytics ni cookie de campagne n'est déposé." : "Aucun choix enregistré : le bandeau vous le demandera."}</span>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => changer(true)} className="btn-ghost min-h-[44px] px-4 text-[14px]">Accepter</button>
        <button type="button" onClick={() => changer(false)} className="btn-ghost min-h-[44px] px-4 text-[14px]">Refuser et effacer</button>
      </div>
    </div>
  );
}
