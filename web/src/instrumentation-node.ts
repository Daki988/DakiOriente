// Chargé par instrumentation.ts côté Node.js seulement.
import { chargerRappels } from "./server/services/appels";
import { verifierEmail } from "./server/lib/messaging-channels";
import { chargerRappels as chargerSalons } from "./server/services/salons";

if (process.env.DATABASE_URL && process.env.NEXT_PHASE !== "phase-production-build") {
  chargerRappels()
    .then((n) => { if (n) console.log(`Rendez-vous d'appel : ${n} rappel(s) programmé(s).`); })
    .catch((e) => console.error("Rappels de rendez-vous non chargés :", e));
  chargerSalons()
    .then((n) => { if (n) console.log(`Salons virtuels : ${n} rappel(s) programmé(s).`); })
    .catch((e) => console.error("Rappels de salons non chargés :", e));
}

// Au démarrage : on ouvre une session SMTP sans envoyer d'e-mail. Si les identifiants sont refusés, la ligne
// apparaît dans le journal de l'application et /api/sante passe en « en échec » (panne du 27/11/2026).
if (process.env.NEXT_PHASE !== "phase-production-build") {
  verifierEmail()
    .then((e) => console.log(`E-mails : ${e.etat}${e.dernierEchec ? ` — ${e.dernierEchec.message}` : ""}`))
    .catch(() => undefined);
}
