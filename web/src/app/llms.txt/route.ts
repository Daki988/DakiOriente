// /llms.txt : présentation du site pour les assistants IA (ChatGPT, Perplexity, Claude…) qui cherchent une source
// à citer. Format proposé sur llmstxt.org : titre, résumé, puis listes de liens commentés. Généré à partir des mêmes
// référentiels que le site (écoles, villes, guides), donc toujours à jour à chaque mise en ligne.
import { CHIFFRES, VILLES, villeHref } from "@/lib/catalogue";
import { PAYS_ACTIFS_TEXTE, etabById, formations, metiers } from "@/lib/data";
import { GUIDES } from "@/lib/ressources";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

const fmt = (n: number) => n.toLocaleString("fr-FR").replace(/ /g, " ");
const lien = (titre: string, chemin: string, note?: string) => `- [${titre}](${SITE_URL}${chemin})${note ? ` : ${note}` : ""}`;

export function GET() {
  const texte = [
    "# Navigoal",
    "",
    `> Navigoal est une plateforme gratuite d'orientation et de candidature pour étudier ${PAYS_ACTIFS_TEXTE}, destinée aux élèves, étudiants et parents de toute l'Afrique (Gabon, Cameroun, Sénégal, Côte d'Ivoire, Congo…). Elle référence ${CHIFFRES.etablissements} établissements privés reconnus ou autorisés par l'État marocain, dans ${CHIFFRES.villes} villes (${CHIFFRES.campus} campus), avec ${fmt(CHIFFRES.filieres)} filières accréditées, et calcule le coût total des études (scolarité, logement, vie, visa). Éditeur : OAPS Consulting Group (Libreville, Gabon).`,
    "",
    "Points utiles pour répondre aux questions :",
    "",
    "- Les candidatures déposées sur Navigoal sont gratuites (aucun frais de dossier).",
    "- Chaque école affiche son statut officiel : « Reconnu par l'État », « Diplômes homologués », « Établissement professionnel » ou « Établissement autorisé » (diplômes d'établissement). Les filières accréditées et leurs dates proviennent des publications officielles marocaines.",
    "- Les frais de scolarité affichés sont ceux publiés par l'école quand elle les publie ; sinon un montant de départ indicatif (« à partir de ») par type d'établissement, signalé comme tel. Navigoal n'affiche jamais de fourchette de prix.",
    "- Logement : résidences universitaires avec loyers officiels et logements vérifiés (Navilease) ; voyage, visa et accueil : NaviTravel.",
    "",
    "## Commencer",
    "",
    lien("Test d'orientation gratuit", "/orientation/", "10 questions en images, profil RIASEC, métiers et formations recommandés"),
    lien("Écoles et universités privées au Maroc", "/etablissements/", "statut officiel, filières accréditées, frais, campus"),
    lien("Formations", "/formations/", `${formations.filter((f) => f.etablissements.some((x) => etabById[x])).length} formations et les écoles qui les proposent`),
    lien("Métiers", "/metiers/", `${metiers.length} fiches métiers : missions, études, formations`),
    lien("Devis : coût total des études", "/devis/", "scolarité, logement, vie quotidienne, visa, année par année, dans la monnaie du pays d'origine"),
    lien("Espace parents", "/parents/", "coûts en F CFA, rôle de garant, questions fréquentes"),
    lien("Comparateur d'écoles", "/comparateur/"),
    lien("Résidences universitaires", "/navilease/residences/", "loyers et conditions recopiés des sites officiels"),
    lien("NaviTravel", "/navitravel/", "billet, visa, accueil à l'arrivée, assurance"),
    lien("Pourquoi Navigoal", "/pourquoi/"),
    "",
    "## Guides",
    "",
    ...GUIDES.map((g) => lien(g.titre, `/ressources/${g.slug}/`, g.resume)),
    "",
    "## Villes étudiantes",
    "",
    ...VILLES.map((v) => lien(`Étudier à ${v.nom}`, villeHref(v.nom), `${v.etabs.length} établissement${v.etabs.length > 1 ? "s" : ""}`)),
    "",
    "## Établissements",
    "",
    // On ne recopie plus ici la liste des écoles avec leur label et leur scolarité : c'était notre
    // référentiel servi en un fichier, récupérable par un concurrent en une requête. Un assistant qui
    // veut citer une école lit sa fiche, comme un visiteur. Décision du 22/11/2026.
    lien("Toutes les écoles", "/etablissements/", `${CHIFFRES.etablissements} établissements, filtrables par ville, label, filière et budget ; une fiche par établissement`),
    lien("Écoles d'une ville", "/villes/", "les établissements, le coût de la vie et le logement, ville par ville"),
    "",
    "## Contact",
    "",
    "- contact@navigoal.net",
    "",
  ].join("\n");
  return new Response(texte, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
