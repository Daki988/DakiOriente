"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

/**
 * Fine barre de progression en haut de l'écran pendant le passage d'une page à l'autre : le clic est pris en compte
 * tout de suite, même quand l'hébergeur met une seconde à répondre. Rien n'est affiché si la page arrive en moins
 * de 120 ms (page préchargée ou déjà vue).
 */
function Barre() {
  const path = usePathname();
  const qs = useSearchParams().toString();
  const [etat, setEtat] = useState<"repos" | "charge" | "fin">("repos");
  const minuteurs = useRef<number[]>([]);
  const vider = () => { minuteurs.current.forEach((t) => window.clearTimeout(t)); minuteurs.current = []; };

  // Arrivée sur la nouvelle page : barre complétée puis effacée.
  useEffect(() => {
    vider();
    setEtat((e) => (e === "charge" ? "fin" : "repos"));
    minuteurs.current.push(window.setTimeout(() => setEtat("repos"), 350));
  }, [path, qs]);

  useEffect(() => {
    const clic = (ev: MouseEvent) => {
      if (ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
      const a = (ev.target as Element | null)?.closest?.("a");
      if (!a || !a.href || a.target === "_blank" || a.hasAttribute("download")) return;
      const u = new URL(a.href, location.href);
      if (u.origin !== location.origin || u.pathname.startsWith("/api/")) return;
      if (u.pathname === location.pathname && u.search === location.search) return; // même page (ancre comprise)
      vider();
      minuteurs.current.push(window.setTimeout(() => setEtat("charge"), 120));
      minuteurs.current.push(window.setTimeout(() => setEtat("repos"), 20000)); // garde-fou
    };
    // Phase de capture : le lien de Next.js annule l'événement (navigation sans rechargement) avant qu'il remonte.
    document.addEventListener("click", clic, true);
    return () => { document.removeEventListener("click", clic, true); vider(); };
  }, []);

  if (etat === "repos") return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]">
      <div className={`h-full bg-gradient-to-r from-brand-600 via-brand-400 to-sun-400 ${etat === "charge" ? "barre-nav-charge" : "barre-nav-fin"}`} />
    </div>
  );
}

export function BarreNavigation() {
  return <Suspense fallback={null}><Barre /></Suspense>;
}
