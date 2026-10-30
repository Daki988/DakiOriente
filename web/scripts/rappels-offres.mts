// Tâche quotidienne : rappels d'échéance des offres payantes (J-30, J-7) aux écoles et à l'équipe, puis
// désactivation des services arrivés à terme. Usage sur le serveur : node outils/env.cjs outils/rappels-offres.mjs
import { rappels } from "../src/server/services/offres";

const r = await rappels();
console.log(`${new Date().toISOString()} · ${r.rappels} rappel(s) d'échéance envoyé(s)`);
process.exit(0);
