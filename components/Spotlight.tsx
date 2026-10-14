"use client";
import { useEffect } from "react";

/**
 * Un seul écouteur pour toute la page : met à jour --mx/--my sur l'élément .spotlight survolé.
 * Désactivé sur écrans tactiles et si l'utilisateur réduit les animations.
 */
export function SpotlightTracker() {
  useEffect(() => {
    if (!matchMedia("(hover: hover)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onMove = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>(".spotlight");
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
  return null;
}
