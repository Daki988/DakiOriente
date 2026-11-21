// Chargé par instrumentation.ts côté Node.js seulement.
import { chargerRappels } from "./server/services/appels";
import { chargerRappels as chargerSalons } from "./server/services/salons";

if (process.env.DATABASE_URL && process.env.NEXT_PHASE !== "phase-production-build") {
  chargerRappels()
    .then((n) => { if (n) console.log(`Rendez-vous d'appel : ${n} rappel(s) programmé(s).`); })
    .catch((e) => console.error("Rappels de rendez-vous non chargés :", e));
  chargerSalons()
    .then((n) => { if (n) console.log(`Salons virtuels : ${n} rappel(s) programmé(s).`); })
    .catch((e) => console.error("Rappels de salons non chargés :", e));
}
