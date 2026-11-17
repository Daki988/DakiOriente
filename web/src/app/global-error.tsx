"use client";
// Erreur au chargement d'une page (remplace l'écran « Application error » en anglais). Cas le plus fréquent : juste
// après une mise à jour, le navigateur ou une page en cache réclame des fichiers de l'ancienne version. On recharge
// alors une fois automatiquement ; sinon, message en français et bouton pour recharger.
import { useEffect } from "react";

const CLE = "navigoal-recharge-erreur";
const estChargement = (e: Error) => /ChunkLoadError|Loading chunk|Loading CSS chunk|Failed to fetch dynamically imported module|importing a module script failed/i.test(`${e.name} ${e.message}`);

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    try {
      const dernier = Number(sessionStorage.getItem(CLE) || 0);
      if (estChargement(error) && Date.now() - dernier > 60_000) {
        sessionStorage.setItem(CLE, String(Date.now()));
        const u = new URL(window.location.href);
        u.searchParams.set("v", String(Date.now()).slice(-6)); // contourne une page gardée en cache
        window.location.replace(u.toString());
      }
    } catch { /* stockage indisponible : on affiche le message */ }
  }, [error]);
  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f6f8fe", color: "#0b1437" }}>
        <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ maxWidth: 420, textAlign: "center", background: "#fff", borderRadius: 24, padding: 28, boxShadow: "0 20px 50px -30px rgba(26,71,245,.35)" }}>
            <p style={{ fontSize: 40, margin: 0 }}>🔄</p>
            <h1 style={{ fontSize: 22, margin: "12px 0 8px" }}>Navigoal vient d&apos;être mis à jour</h1>
            <p style={{ color: "#5b6785", lineHeight: 1.5, margin: "0 0 20px" }}>Recharge la page pour afficher la nouvelle version.</p>
            <button onClick={() => { try { sessionStorage.removeItem(CLE); } catch { /* */ } window.location.reload(); }} style={{ background: "#1a47f5", color: "#fff", border: 0, borderRadius: 14, padding: "14px 22px", fontSize: 16, fontWeight: 700, width: "100%" }}>Recharger la page</button>
            <button onClick={() => reset()} style={{ marginTop: 10, background: "transparent", color: "#1a47f5", border: 0, fontSize: 14, fontWeight: 600 }}>Réessayer sans recharger</button>
          </div>
        </main>
      </body>
    </html>
  );
}
