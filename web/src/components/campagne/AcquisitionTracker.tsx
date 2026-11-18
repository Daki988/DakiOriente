"use client";
import { useEffect, useState } from "react";
import Link from "@/components/ui/Link";
import { ACQ_COOKIE } from "@/lib/campagne";

/** Choix de la personne pour le seul cookie non indispensable (ng_acq) : « oui », « non » ou rien (pas encore demandé). */
export const CLE_CHOIX_COOKIES = "navigoal-cookies";
const lireChoix = () => { try { return localStorage.getItem(CLE_CHOIX_COOKIES); } catch { return null; } };
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

/**
 * Mémorise pendant 90 jours le premier lien suivi (utm_source, utm_campaign…) ou le code parrain (?ref=)
 * par lequel la personne arrive sur le site ; le serveur le lit à l'inscription. Ce cookie n'étant pas indispensable,
 * il n'est déposé qu'avec l'accord de la personne : un bandeau le demande, seulement quand un tel lien est suivi.
 */
export function AcquisitionTracker() {
  const [enAttente, setEnAttente] = useState<Acq | null>(null);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const ref = p.get("ref");
    const source = p.get("utm_source");
    if (!ref && !source) return;
    const deja = lire();
    if (deja && (!ref || deja.ref)) return;
    const v: Acq = {
      source: source ?? undefined, medium: p.get("utm_medium") ?? undefined, campaign: p.get("utm_campaign") ?? undefined,
      content: p.get("utm_content") ?? undefined, ref: ref ?? undefined, landing: window.location.pathname, at: new Date().toISOString(),
    };
    const choix = lireChoix();
    if (choix === "oui") poser(v);
    else if (choix !== "non") setEnAttente(v);
  }, []);
  if (!enAttente) return null;
  const repondre = (oui: boolean) => {
    try { localStorage.setItem(CLE_CHOIX_COOKIES, oui ? "oui" : "non"); } catch { /* stockage indisponible */ }
    if (oui) poser(enAttente);
    setEnAttente(null);
  };
  return (
    <div role="dialog" aria-label="Cookie de campagne" className="fixed inset-x-3 bottom-3 z-[65] mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-4 text-[13.5px] text-ink-soft shadow-[0_20px_50px_-15px_rgba(11,21,51,.35)] sm:bottom-5 print:hidden">
      <p>
        {enAttente.ref ? "Vous arrivez avec un code de parrainage." : "Vous arrivez par un lien de campagne."} Navigoal peut s&apos;en souvenir pendant 90 jours pour l&apos;associer à votre inscription{enAttente.ref ? " et créditer votre parrain" : ""} : un cookie interne, sans publicité ni service tiers.{" "}
        <Link href="/cookies/" className="font-bold text-brand-600 underline-offset-2 hover:underline">En savoir plus</Link>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => repondre(true)} className="btn-primary min-h-[44px] px-4 text-[14px]">Accepter</button>
        <button type="button" onClick={() => repondre(false)} className="btn-ghost min-h-[44px] px-4 text-[14px]">Refuser</button>
      </div>
    </div>
  );
}

/** Sur la page « Politique cookies » : revoir son choix pour le cookie de campagne (ng_acq). */
export function ChoixCookies() {
  const [choix, setChoix] = useState<string | null>(null);
  useEffect(() => setChoix(lireChoix()), []);
  const changer = (oui: boolean) => {
    try { localStorage.setItem(CLE_CHOIX_COOKIES, oui ? "oui" : "non"); } catch { /* stockage indisponible */ }
    if (!oui) document.cookie = `${ACQ_COOKIE}=; Max-Age=0; Path=/`;
    setChoix(oui ? "oui" : "non");
  };
  return (
    <div className="not-prose my-6 flex flex-col gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 p-4 text-[14px] print:hidden">
      <b className="text-ink">Votre choix pour le cookie de campagne (ng_acq)</b>
      <span className="text-ink-soft">{choix === "oui" ? "Accepté." : choix === "non" ? "Refusé : aucun cookie de campagne n'est déposé." : "Aucun choix enregistré : la question vous sera posée si vous arrivez par un lien de campagne ou de parrainage."}</span>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => changer(true)} className="btn-ghost min-h-[44px] px-4 text-[14px]">Accepter</button>
        <button type="button" onClick={() => changer(false)} className="btn-ghost min-h-[44px] px-4 text-[14px]">Refuser et effacer</button>
      </div>
    </div>
  );
}
