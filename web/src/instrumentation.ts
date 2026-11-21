// Au démarrage du serveur Node.js : minuteurs des rappels « rendez-vous dans 15 minutes » (rendez-vous d'appel planifiés).
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || !process.env.DATABASE_URL || process.env.NEXT_PHASE === "phase-production-build") return;
  try {
    const { chargerRappels } = await import("./server/services/appels");
    const n = await chargerRappels();
    if (n) console.log(`Rendez-vous d'appel : ${n} rappel(s) programmé(s).`);
  } catch (e) { console.error("Rappels de rendez-vous non chargés :", e); }
}
