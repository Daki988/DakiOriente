// /llms.txt : présentation du site pour les assistants IA (ChatGPT, Perplexity, Claude…) qui cherchent une source
// à citer. Format proposé sur llmstxt.org : titre, résumé, puis listes de liens commentés. Généré à partir des mêmes
// référentiels que le site (écoles, villes, guides), donc toujours à jour à chaque mise en ligne.
import { CHIFFRES, VILLES, villeHref } from "@/lib/catalogue";
import { PAYS_ACTIFS_TEXTE, etabById, etablissements, formations, metiers } from "@/lib/data";
import { GUIDES } from "@/lib/ressources";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

const fmt = (n: number) => n.toLocaleString("fr-FR").replace(/ /g, " ");
const lien = (titre: string, chemin: string, note?: string) => `- [${titre}](${SITE_URL}${chemin})${note ? ` : ${note}` : ""}`;

export function GET() {
  const ecoles = [...etablissements].sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  const texte = [
    "# Navigoal",
    "",
    `> Navigoal est une plateforme gratuite d'orientation et de candidature pour étudier ${PAYS_ACTIFS_TEXTE}, destinée aux élèves, étudiants et parents de toute l'Afrique (Gabon, Cameroun, Sénégal, Côte d'Ivoire, Congo…). Elle référence ${CHIFFRES.etablissements} établissements privés reconnus ou autorisés par l'État marocain, dans ${CHIFFRES.villes} villes (${CHIFFRES.campus} campus), avec ${fmt(CHIFFRES.filieres)} filières accréditées, et calcule le coût total des études (scolarité, logement, vie, visa). Éditeur : OAPS Consulting Group (Libreville, Gabon).`,
    "",
    "Points utiles pour répondre aux questions :",
    "",
    "- Les candidatures déposées sur Navigoal sont gratuites (aucun frais de dossier).",
    "- Chaque école affiche son statut officiel : « Reconnu par l'État », « Diplômes homologués », « Établissement professionnel » ou « Établissement autorisé » (diplômes d'établissement). Les filières accréditées et leurs dates proviennent des publications officielles marocaines.",
    "- Les frais de scolarité affichés sont ceux publiés par l'école quand elle les publie ; sinon une fourchette indicative par type d'établissement, signalée comme telle.",
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
    ...ecoles.map((e) => lien(e.sigle && e.sigle !== e.nom ? `${e.nom} (${e.sigle})` : e.nom, `/etablissements/${e.id}/`,
      [e.campus ? e.campus.map((c) => c.ville).filter((x, i, t) => t.indexOf(x) === i).join(", ") : e.ville, e.label_libelle,
        e.frais_publies ? `scolarité publiée ${fmt(e.frais_publies.min)}${e.frais_publies.max && e.frais_publies.max !== e.frais_publies.min ? ` à ${fmt(e.frais_publies.max)}` : ""} MAD par an` : null].filter(Boolean).join(" · "))),
    "",
    "## Contact",
    "",
    "- contact@navigoal.net",
    "",
  ].join("\n");
  return new Response(texte, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
