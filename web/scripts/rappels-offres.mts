// Tâche quotidienne : rappels d'échéance des offres payantes (J-30, J-7) aux écoles et à l'équipe, puis
// désactivation des services arrivés à terme. Usage sur le serveur : node outils/env.cjs outils/rappels-offres.mjs
// Envoie aussi les rappels aux élèves (pièce demandée, candidature en brouillon avant la clôture) et les relances
// des candidatures restées sans réponse de l'école (J+3, J+6, puis équipe Navigoal et élève à J+8).
import { rappels } from "../src/server/services/offres";
import { rappelsEleves } from "../src/server/services/rappels-eleves";
import { relancesEcoles } from "../src/server/services/reactivite";
import { invitationsAvis } from "../src/server/services/avis-ecoles";

const r = await rappels();
console.log(`${new Date().toISOString()} · ${r.rappels} rappel(s) d'échéance envoyé(s)`);
const e = await rappelsEleves().catch((err) => { console.error("rappels élèves :", err); return { envoyes: 0 }; });
console.log(`${new Date().toISOString()} · ${e.envoyes} rappel(s) envoyé(s) aux élèves`);
const rel = await relancesEcoles().catch((err) => { console.error("relances écoles :", err); return { envoyees: 0 }; });
console.log(`${new Date().toISOString()} · ${rel.envoyees} relance(s) de candidatures sans réponse`);
const inv = await invitationsAvis().catch((err) => { console.error("invitations avis :", err); return { envoyees: 0 }; });
console.log(`${new Date().toISOString()} · ${inv.envoyees} invitation(s) à donner un avis sur son école`);
process.exit(0);
