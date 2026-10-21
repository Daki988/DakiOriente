"use client";
import { useEffect } from "react";
import { ACQ_COOKIE } from "@/lib/campagne";

const lire = () => {
  const m = document.cookie.match(new RegExp(`(?:^|; )${ACQ_COOKIE}=([^;]*)`));
  if (!m) return null;
  try { return JSON.parse(decodeURIComponent(m[1])) as { ref?: string }; } catch { return null; }
};

/**
 * Mémorise pendant 90 jours le premier lien suivi (utm_source, utm_campaign…) ou le code parrain (?ref=)
 * par lequel la personne arrive sur le site. Le serveur le lit à l'inscription.
 * Un code parrain l'emporte sur un lien suivi déjà mémorisé ; sinon la première visite fait foi.
 */
export function AcquisitionTracker() {
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const ref = p.get("ref");
    const source = p.get("utm_source");
    if (!ref && !source) return;
    const deja = lire();
    if (deja && (!ref || deja.ref)) return;
    const v = {
      source: source ?? undefined, medium: p.get("utm_medium") ?? undefined, campaign: p.get("utm_campaign") ?? undefined,
      content: p.get("utm_content") ?? undefined, ref: ref ?? undefined, landing: window.location.pathname, at: new Date().toISOString(),
    };
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${ACQ_COOKIE}=${encodeURIComponent(JSON.stringify(v))}; Max-Age=${90 * 86400}; Path=/; SameSite=Lax${secure}`;
  }, []);
  return null;
}
