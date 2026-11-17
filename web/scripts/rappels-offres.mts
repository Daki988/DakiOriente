// Tâche quotidienne : rappels d'échéance des offres payantes (J-30, J-7) aux écoles et à l'équipe, puis
// désactivation des services arrivés à terme. Usage sur le serveur : node outils/env.cjs outils/rappels-offres.mjs
// Envoie aussi les rappels aux élèves (pièce demandée, candidature en brouillon avant la clôture).
import { rappels } from "../src/server/services/offres";
import { rappelsEleves } from "../src/server/services/rappels-eleves";

const r = await rappels();
console.log(`${new Date().toISOString()} · ${r.rappels} rappel(s) d'échéance envoyé(s)`);
const e = await rappelsEleves().catch((err) => { console.error("rappels élèves :", err); return { envoyes: 0 }; });
console.log(`${new Date().toISOString()} · ${e.envoyes} rappel(s) envoyé(s) aux élèves`);
process.exit(0);
