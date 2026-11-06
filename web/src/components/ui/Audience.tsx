"use client";
// Mesure d'audience sans cookie : une requête légère par page vue (chemin, provenance, campagne). Respecte « Ne pas suivre ».
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function Audience() {
  const path = usePathname();
  const premier = useRef(true);
  useEffect(() => {
    try {
      if (navigator.doNotTrack === "1" || path.startsWith("/admin")) return;
      const u = new URLSearchParams(window.location.search).get("utm_source");
      // La provenance n'a de sens que pour la première page ; ensuite, la navigation est interne.
      const r = premier.current ? document.referrer : window.location.origin + "/";
      premier.current = false;
      const body = JSON.stringify({ p: path, r, u });
      fetch("/api/vu/", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true, credentials: "same-origin" }).catch(() => undefined);
    } catch { /* mesure facultative */ }
  }, [path]);
  return null;
}
