// Ressources Navigoal : guides pratiques rédigés à partir des référentiels, outils interactifs et modèles téléchargeables.
// Aucune ressource fictive : chaque carte renvoie vers un contenu qui existe sur le site.
import { CHIFFRES } from "./catalogue";
import { LABELS, domaineById, metiers, paysDetailById } from "./data";
import { paysOrigine } from "./pays-origine";

export type TypeRessource = "guide" | "fiche-metier" | "orientation" | "outil";
export type Format = "page" | "interactif" | "docx";
export type Public = "lyceen" | "etudiant" | "parent";
export type Section = { titre: string; texte?: string[]; liste?: string[] };
export type Ressource = {
  slug: string; titre: string; resume: string; type: TypeRessource; theme: string; format: Format; publics: Public[];
  href: string; photo?: string; icone: string; couleur: string; lecture?: number; sections?: Section[]; sources?: string[]; fichier?: string;
};

export const TYPES: { id: TypeRessource; libelle: string; icone: string }[] = [
  { id: "guide", libelle: "Guides pratiques", icone: "book-open" },
  { id: "fiche-metier", libelle: "Fiches métiers", icone: "briefcase" },
  { id: "orientation", libelle: "Orientation", icone: "compass" },
  { id: "outil", libelle: "Outils et modèles", icone: "wrench" },
];
export const FORMATS: Record<Format, string> = { page: "Article", interactif: "Outil en ligne", docx: "Document Word (.docx)" };
export const PUBLICS: Record<Public, string> = { lyceen: "Lycéens", etudiant: "Étudiants", parent: "Parents" };
export const THEMES: { id: string; libelle: string; icone: string; couleur: string }[] = [
  { id: "maroc", libelle: "Étudier au Maroc", icone: "map-pin", couleur: "#c1272d" },
  { id: "demarches", libelle: "Visa et démarches", icone: "plane", couleur: "#1a47f5" },
  { id: "vie", libelle: "Logement et budget", icone: "house", couleur: "#a55a00" },
  { id: "orientation", libelle: "Orientation", icone: "compass", couleur: "#0f8a46" },
  { id: "candidature", libelle: "Candidature", icone: "file-check", couleur: "#6a3df0" },
  ...Array.from(new Set(metiers.map((m) => m.domaine))).map((d) => ({ id: d, libelle: domaineById[d].libelle.split(",")[0], icone: "briefcase", couleur: "#374151" })),
];

const MA = paysDetailById.MA;
const B = MA.budget;
const dispenses = paysOrigine.filter((p) => p.continent === "afrique" && p.visa === "dispense");
const evisa = paysOrigine.filter((p) => p.continent === "afrique" && p.visa === "evisa");
const mad = (n: number) => `${Math.round(n).toLocaleString("fr-FR").replace(/[  ]/g, " ")} MAD`;

export const GUIDES: Ressource[] = [
  {
    slug: "etudier-au-maroc", titre: "Étudier au Maroc : le guide complet", type: "guide", theme: "maroc", format: "page", publics: ["lyceen", "etudiant", "parent"], href: "/ressources/etudier-au-maroc/", photo: "laptop", icone: "map-pin", couleur: "#c1272d", lecture: 6,
    resume: "Système d'études, établissements privés, labels officiels, calendrier, villes et budget : l'essentiel avant de choisir.",
    sections: [
      { titre: "Pourquoi le Maroc ?", liste: MA.pourquoi.filter((t) => !/Libreville|Dakar/.test(t)) },
      { titre: "Le système d'études", texte: [MA.systeme, `Navigoal référence ${CHIFFRES.etablissements} établissements privés répartis dans ${CHIFFRES.villes} villes (${CHIFFRES.campus} campus), avec ${CHIFFRES.filieres.toLocaleString("fr-FR")} filières accréditées par l'État.`] },
      { titre: "Établissements privés et labels", texte: [MA.reconnaissance, "Sur chaque fiche établissement, Navigoal affiche le label officiel et, pour chaque filière, la date de fin de son accréditation."] },
      { titre: "Calendrier", texte: [MA.calendrier, "Anticipe : les démarches de visa, de légalisation des diplômes et de logement prennent plusieurs semaines."] },
      { titre: "Où étudier ?", liste: MA.villes.map((v) => `${v.nom} : ${v.profil}`) },
      { titre: "Combien ça coûte ?", texte: [`Frais de scolarité dans le privé : ${mad(MA.frais_prive.min)} à ${mad(MA.frais_prive.max)} ${MA.frais_prive.unite}. ${MA.frais_prive.note}`, `Vie quotidienne : ${mad(B.total_mensuel.min)} à ${mad(B.total_mensuel.max)} par mois. ${B.note}`] },
      { titre: "Travail, santé, paiements", liste: [MA.travail, MA.sante, `Moyens de paiement courants : ${MA.paiement.join(", ")}.`] },
      { titre: "Bourses", liste: MA.bourses },
    ],
    sources: MA.sources,
  },
  {
    slug: "visa-carte-de-sejour", titre: "Visa et carte de séjour étudiant", type: "guide", theme: "demarches", format: "page", publics: ["lyceen", "etudiant", "parent"], href: "/ressources/visa-carte-de-sejour/", icone: "plane", couleur: "#1a47f5", lecture: 5,
    resume: "Entrée au Maroc selon ta nationalité (sans visa, AEVM, e-Visa ou visa consulaire), puis carte de séjour étudiant.",
    sections: [
      { titre: "1. Avant le départ : le régime d'entrée", texte: [`Le régime dépend de ta nationalité. ${dispenses.length} pays d'Afrique sont dispensés de visa pour un séjour de moins de 90 jours (${dispenses.slice(0, 8).map((p) => p.nom).join(", ")}…). ${evisa.length ? `D'autres passent par l'e-Visa (${evisa.slice(0, 5).map((p) => p.nom).join(", ")}…), à demander en ligne sur acces-maroc.ma.` : ""} Les autres nationalités demandent un visa auprès de l'ambassade ou du consulat du Maroc.`, "Choisis ta nationalité dans l'outil ci-dessous pour connaître ta démarche."] },
      { titre: "2. Les pièces à préparer", liste: MA.visa.filter((t) => t.startsWith("Pièces")).flatMap((t) => t.replace(/^Pièces courantes : /, "").replace(/\.$/, "").split(", ")).map((t) => t.charAt(0).toUpperCase() + t.slice(1)).concat(["Diplôme du baccalauréat et relevés de notes légalisés (et traduits si besoin)"]) },
      { titre: "3. À l'arrivée : la carte de séjour", texte: MA.visa.filter((t) => t.startsWith("Carte")).concat(["Le dépôt se fait au service des étrangers de la Direction générale de la sûreté nationale (DGSN) de ta ville, dans les 90 jours qui suivent l'entrée sur le territoire. Garde une copie de tous les documents déposés et le récépissé."]) },
      { titre: "4. Chaque année", liste: ["Renouvelle la carte avant son expiration avec la nouvelle attestation d'inscription.", "Mets à jour ton certificat d'hébergement si tu changes de logement.", "Vérifie la validité de ton passeport (au moins la durée de la carte demandée)."] },
      { titre: "Bon à savoir", liste: [MA.travail, "Les règles évoluent : vérifie toujours auprès du consulat du Maroc de ton pays et de ton établissement avant le départ."] },
    ],
    sources: ["https://www.acces-maroc.ma", "https://www.consulat.ma", ...MA.sources],
  },
  {
    slug: "logement-etudiant", titre: "Trouver un logement étudiant au Maroc", type: "guide", theme: "vie", format: "page", publics: ["etudiant", "parent"], href: "/ressources/logement-etudiant/", icone: "house", couleur: "#a55a00", lecture: 4,
    resume: "Types de logements, loyers, caution, contrat de bail et pièges à éviter quand on arrive de l'étranger.",
    sections: [
      { titre: "Les options", liste: ["Résidence étudiante privée : chambre ou studio meublé, charges souvent incluses, gardiennage ; idéal pour la première année.", "Studio ou appartement en location : plus d'autonomie, à proximité du campus ou d'une ligne de tramway.", "Colocation : loyer et charges partagés ; vérifie que le bail mentionne chaque colocataire.", "Chez l'habitant : chambre dans une famille, cadre rassurant pour les plus jeunes.", "Logement proposé par l'établissement : certaines écoles ont une résidence ou des partenaires (voir la fiche de l'école)."] },
      { titre: "Budget", texte: [`Compte ${mad(B.lignes[0].min)} à ${mad(B.lignes[0].max)} par mois pour le logement (studio ou colocation). ${B.note}`, "À l'entrée, prévois en général une caution (souvent un à deux mois de loyer) et le premier mois payé d'avance."] },
      { titre: "Le contrat et les papiers", liste: ["Exige un contrat de bail écrit, signé par le bailleur et par toi.", "La signature du bail est généralement légalisée à la commune : ce document sert de justificatif d'hébergement pour la carte de séjour.", "Fais un état des lieux d'entrée avec photos datées.", "Demande une quittance pour chaque loyer payé."] },
      { titre: "Éviter les arnaques", liste: ["Ne paie jamais de loyer ni de caution avant d'avoir visité (ou fait visiter) le logement et signé un contrat.", "Méfie-toi des prix très inférieurs au marché et des bailleurs pressés.", "Avec Navilease, le paiement est conservé en séquestre jusqu'à ton entrée dans les lieux, et les bailleurs sont vérifiés."] },
      { titre: "Choisir le quartier", texte: ["Regarde le temps de trajet jusqu'au campus, les lignes de tramway ou de bus et l'animation du quartier. Les pages villes de Navigoal listent les quartiers étudiants et les transports de chaque ville."] },
    ],
  },
  {
    slug: "choisir-sa-filiere", titre: "Choisir sa filière en 6 étapes", type: "orientation", theme: "orientation", format: "page", publics: ["lyceen", "etudiant", "parent"], href: "/ressources/choisir-sa-filiere/", photo: "education", icone: "compass", couleur: "#0f8a46", lecture: 4,
    resume: "De tes centres d'intérêt au choix de l'école : une méthode simple pour décider en confiance.",
    sections: [
      { titre: "1. Connaître ton profil", texte: ["Commence par le test d'orientation Navigoal : il situe tes intérêts selon six profils (réaliste, investigateur, artistique, social, entreprenant, conventionnel) et propose des domaines compatibles."] },
      { titre: "2. Partir des métiers", texte: [`Explore les ${CHIFFRES.metiers} fiches métiers : missions, compétences, niveau d'études et formations qui y mènent. Garde deux ou trois métiers qui t'attirent.`] },
      { titre: "3. Choisir le niveau et la durée", liste: ["Bac+2 (BTS, DUT, technicien spécialisé) : entrée rapide dans la vie active.", "Bac+3 (licence, bachelor) : base solide, poursuite possible en master.", "Bac+5 (master, ingénieur, programme grande école) : postes d'encadrement et d'expertise.", "Santé : cursus longs (jusqu'à 7 ans pour la médecine) et admission sélective."] },
      { titre: "4. Vérifier l'admission", texte: ["Regarde le mode d'admission (de droit, sur dossier, concours, entretien) et les séries du baccalauréat conseillées. Prépare tes relevés de notes dès la première."] },
      { titre: "5. Vérifier le label et la filière", texte: ["Préfère un établissement reconnu par l'État ou une filière accréditée : tes diplômes seront homologués. Le guide des labels t'explique les différences."] },
      { titre: "6. Comparer les écoles", texte: ["Utilise le comparateur Navigoal : mêmes formations ou mêmes métiers visés, coût total, admission, visa et logement côte à côte. Puis estime le budget complet avec le devis parents."] },
    ],
  },
  {
    slug: "labels-reconnaissance-etat", titre: "Labels « Reconnu par l'État » et « Diplômes homologués » : ce qu'il faut savoir", type: "guide", theme: "maroc", format: "page", publics: ["lyceen", "etudiant", "parent"], href: "/ressources/labels-reconnaissance-etat/", icone: "shield-check", couleur: "#0f8a46", lecture: 3,
    resume: "Comprendre les labels officiels des établissements privés marocains et le statut de chaque filière.",
    sections: [
      { titre: "Les quatre labels", liste: LABELS.map((l) => `${l.libelle} : ${l.description}`) },
      { titre: "Le statut des filières", liste: ["Accréditée : la filière dispose d'une accréditation en cours, publiée par arrêté au Bulletin officiel, avec sa date d'échéance.", "Accrédité (échéance récente) : l'accréditation est arrivée à échéance récemment ; le renouvellement est à confirmer auprès de l'établissement.", "Accréditation échue : la filière délivre un diplôme d'établissement tant qu'aucun renouvellement n'est publié."] },
      { titre: "Pourquoi c'est important", texte: ["Un diplôme homologué par l'État est équivalent au diplôme national : il facilite la poursuite d'études, les concours et la reconnaissance dans ton pays d'origine. Un diplôme d'établissement peut être de qualité, mais sa reconnaissance n'est pas automatique."] },
      { titre: "Les bons réflexes", liste: ["Vérifie le label sur la fiche Navigoal de l'établissement et du campus visé (il peut différer d'un campus à l'autre).", "Demande à l'école le numéro de l'arrêté d'accréditation de ta filière.", "Pour une équivalence dans ton pays, renseigne-toi auprès du ministère de l'Enseignement supérieur de ton pays."] },
    ],
    sources: ["Listes du ministère de l'Enseignement supérieur, de la Recherche scientifique et de l'Innovation (Maroc)", "Arrêtés d'accréditation publiés au Bulletin officiel"],
  },
  {
    slug: "budget-etudiant", titre: "Préparer son budget étudiant au Maroc", type: "guide", theme: "vie", format: "page", publics: ["etudiant", "parent"], href: "/ressources/budget-etudiant/", photo: "finance", icone: "wallet", couleur: "#a55a00", lecture: 3,
    resume: "Frais de scolarité, coût de la vie mois par mois, installation et imprévus : les bons ordres de grandeur.",
    sections: [
      { titre: "Le coût de la vie par mois", liste: B.lignes.map((l) => `${l.poste} : ${mad(l.min)} à ${mad(l.max)}`).concat([`Total : ${mad(B.total_mensuel.min)} à ${mad(B.total_mensuel.max)} par mois. ${B.note}`]) },
      { titre: "Les frais de scolarité", texte: [`Dans le privé : ${mad(MA.frais_prive.min)} à ${mad(MA.frais_prive.max)} ${MA.frais_prive.unite}. ${MA.frais_prive.note}`, "Ajoute les frais d'inscription et de dossier, publiés sur la fiche de l'établissement quand ils sont connus."] },
      { titre: "L'installation", liste: ["Billet d'avion aller-retour.", "Visa ou e-Visa selon la nationalité, puis carte de séjour (timbre, photos, copies).", "Caution et premier mois de loyer.", "Assurance santé (obligatoire pour la carte de séjour).", "Équipement : ordinateur, fournitures, téléphone."] },
      { titre: "Nos conseils", liste: ["Garde une réserve pour les imprévus (environ un mois de dépenses).", "Les taux de change varient : Navigoal ajoute une marge de prudence de 3 % aux conversions.", "Utilise le devis parents pour obtenir le coût total sur toute la durée des études."] },
    ],
  },
];

export const OUTILS: Ressource[] = [
  { slug: "modele-cv", titre: "Modèle de CV étudiant", resume: "Un CV d'une page, clair et modifiable, adapté à une candidature en école ou en stage.", type: "outil", theme: "candidature", format: "docx", publics: ["lyceen", "etudiant"], href: "/ressources/modeles/modele-cv-etudiant-navigoal.docx", fichier: "/ressources/modeles/modele-cv-etudiant-navigoal.docx", icone: "file-text", couleur: "#1a47f5" },
  { slug: "modele-lettre-motivation", titre: "Modèle de lettre de motivation", resume: "Une lettre structurée (vous, moi, nous) à personnaliser pour chaque établissement.", type: "outil", theme: "candidature", format: "docx", publics: ["lyceen", "etudiant"], href: "/ressources/modeles/modele-lettre-motivation-navigoal.docx", fichier: "/ressources/modeles/modele-lettre-motivation-navigoal.docx", icone: "file-text", couleur: "#6a3df0" },
  { slug: "checklist-candidature", titre: "Checklist de candidature", resume: "Toutes les étapes et pièces, de la candidature à l'arrivée au Maroc, à cocher au fur et à mesure.", type: "outil", theme: "candidature", format: "interactif", publics: ["lyceen", "etudiant", "parent"], href: "/ressources/checklist-candidature/", icone: "list-checks", couleur: "#0f8a46" },
  { slug: "calculateur-moyenne-bac", titre: "Calculateur de moyenne du bac", resume: "Calcule ta moyenne avec tes coefficients, ou ta note du bac marocain (régional, contrôle continu, national).", type: "outil", theme: "orientation", format: "interactif", publics: ["lyceen"], href: "/ressources/calculateur-moyenne-bac/", icone: "calculator", couleur: "#e2701b" },
  { slug: "test-orientation", titre: "Simulateur d'orientation", resume: "Le test d'orientation Navigoal : ton profil d'intérêts et les domaines qui te correspondent.", type: "orientation", theme: "orientation", format: "interactif", publics: ["lyceen", "etudiant"], href: "/orientation", icone: "compass", couleur: "#0f8a46" },
  { slug: "convertisseur-devises", titre: "Convertisseur de devises", resume: "Convertis les dirhams dans la monnaie de ton pays au taux du jour (marge de prudence de 3 %).", type: "outil", theme: "vie", format: "interactif", publics: ["etudiant", "parent"], href: "/ressources/convertisseur-devises/", icone: "repeat", couleur: "#0e7490" },
  { slug: "devis-parents", titre: "Devis du coût total des études", resume: "Scolarité, vie quotidienne, installation et voyages sur toute la durée de la formation.", type: "outil", theme: "vie", format: "interactif", publics: ["parent"], href: "/devis", icone: "wallet", couleur: "#a55a00" },
  { slug: "comparateur", titre: "Comparateur d'établissements", resume: "Compare jusqu'à quatre écoles pour une même formation ou un même métier.", type: "orientation", theme: "orientation", format: "interactif", publics: ["lyceen", "etudiant", "parent"], href: "/comparateur", icone: "scale", couleur: "#1a47f5" },
];

export const FICHES: Ressource[] = metiers.map((m) => ({
  slug: m.id, titre: `Fiche métier : ${m.nom}`, resume: m.description, type: "fiche-metier", theme: m.domaine, format: "page", publics: ["lyceen", "etudiant"],
  href: `/metiers/${m.id}/`, icone: "briefcase", couleur: "#374151",
}));

export const RESSOURCES: Ressource[] = [...GUIDES, ...OUTILS, ...FICHES];
export const guideBySlug = Object.fromEntries(GUIDES.map((g) => [g.slug, g])) as Record<string, Ressource>;
export const PAGES_OUTILS = ["checklist-candidature", "calculateur-moyenne-bac", "convertisseur-devises"] as const;
