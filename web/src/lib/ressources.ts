// Ressources Navigoal : guides pratiques rédigés à partir des référentiels, outils interactifs et modèles téléchargeables.
// Aucune ressource fictive : chaque carte renvoie vers un contenu qui existe sur le site.
import { prefixePrix, prixTexte } from "./prix";
import { CHIFFRES } from "./catalogue";
import { LABELS, domaineById, etablissements, metiers, paysDetailById } from "./data";
import { paysOrigine } from "./pays-origine";
const aPartir = (v: { min: number; max: number }) => prefixePrix(v);

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

// ---------------------------------------------------------------- Frais de scolarité réellement publiés
// Recalculé à chaque construction du site depuis `site.frais` du référentiel (→ `frais_publies`) : aucun
// chiffre n'est recopié à la main, donc la page ne peut pas vieillir en silence.
// Règle d'affichage (lib/prix.ts) : jamais de fourchette. La médiane est une statistique sur les tarifs
// d'entrée publiés, pas une borne haute : sans elle, le minimum laisserait croire que c'est le prix courant.
const PUBLIENT = etablissements.filter((e) => e.frais_publies);
const mediane = (a: number[]) => {
  const s = [...a].sort((x, y) => x - y);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};
const FRAIS_PAR_TYPE = Object.entries(
  PUBLIENT.reduce<Record<string, number[]>>((acc, e) => {
    (acc[e.type_libelle] ||= []).push(e.frais_publies!.min);
    return acc;
  }, {}),
)
  .map(([type, mins]) => ({ type, n: mins.length, min: Math.min(...mins), med: mediane(mins) }))
  .filter((t) => t.n >= 2)
  .sort((a, b) => b.n - a.n);
const FRAIS_MINS = PUBLIENT.map((e) => e.frais_publies!.min);
const FRAIS_MED = FRAIS_MINS.length ? mediane(FRAIS_MINS) : 0;
const SANS_TARIF = etablissements.length - PUBLIENT.length;

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
      { titre: "Combien ça coûte ?", texte: [`Frais de scolarité dans le privé : ${aPartir(MA.frais_prive)}${mad(MA.frais_prive.min)} ${MA.frais_prive.unite}. ${MA.frais_prive.note}`, `Vie quotidienne : ${aPartir(B.total_mensuel)}${mad(B.total_mensuel.min)} par mois. ${B.note}`] },
      { titre: "Travail, santé, paiements", liste: [MA.travail, MA.sante, `Moyens de paiement courants : ${MA.paiement.join(", ")}.`] },
      { titre: "Bourses", liste: MA.bourses },
    ],
    sources: MA.sources,
  },
  {
    slug: "frais-scolarite-ecoles-privees-maroc", titre: "Frais de scolarité des écoles privées au Maroc", type: "guide", theme: "maroc", format: "page", publics: ["lyceen", "etudiant", "parent"], href: "/ressources/frais-scolarite-ecoles-privees-maroc/", photo: "finance", icone: "wallet", couleur: "#c1272d", lecture: 6,
    resume: `Ce que coûte vraiment une année : les tarifs publiés par ${PUBLIENT.length} écoles sur ${etablissements.length}, ce qui s'ajoute à la scolarité, et les questions à poser à celles qui ne publient rien.`,
    sections: [
      { titre: "L'essentiel", liste: [
        `Sur les ${etablissements.length} établissements privés que nous référençons au Maroc, ${PUBLIENT.length} publient leur tarif sur leur propre site. ${SANS_TARIF} ne le publient pas : c'est la règle, pas l'exception.`,
        `Chez celles qui publient, la moitié affichent un tarif d'entrée inférieur à ${mad(FRAIS_MED)} par an. Le plus bas relevé est de ${mad(Math.min(...FRAIS_MINS))}.`,
        "Le tarif annoncé n'est jamais la facture : il faut y ajouter les frais d'inscription, de dossier et l'assurance scolaire, puis le logement et la vie quotidienne.",
        "Le prix ne dit rien de la valeur du diplôme. Une école chère dont la filière n'est plus accréditée délivre un diplôme d'établissement, pas un diplôme homologué par l'État.",
        "Tous les montants de cette page viennent des sites officiels des écoles et sont relus à chaque mise à jour du site. Aucun n'est une estimation.",
      ] },
      { titre: "Ce que publient vraiment les écoles, par type d'établissement", texte: [
        `Nous avons relevé les tarifs publiés par les écoles elles-mêmes. Pour chaque type, le tarif d'entrée le plus bas, et la médiane des tarifs d'entrée : la moitié des écoles du groupe demandent moins que ce montant. Nous n'affichons jamais de fourchette, parce qu'une fourchette large (« de 30 000 à 130 000 ») n'aide personne à décider.`,
      ], liste: FRAIS_PAR_TYPE.map((t) => `${t.type} (${t.n} écoles qui publient) : ${prixTexte({ min: t.min, max: t.med }, mad)} par an, médiane ${mad(t.med)}.`) },
      { titre: "Ce qui s'ajoute à la scolarité", liste: [
        "Frais d'inscription, de dossier et assurance scolaire : ils varient beaucoup d'une école à l'autre et se paient en plus de la scolarité, souvent à la réservation de la place. Demande-les par écrit : peu d'écoles les publient.",
        "Caution et premier mois de loyer, à verser avant d'entrer dans le logement.",
        "Assurance santé annuelle, obligatoire pour obtenir la carte de séjour.",
        "Équipement de départ : literie, ordinateur, fournitures.",
        "Billet d'avion, et carte de séjour à renouveler chaque année.",
        "Le devis Navigoal calcule tout cela sur la durée complète de la formation, poste par poste, et tu peux décocher ce qui ne te concerne pas.",
      ] },
      { titre: "Et si l'école ne publie pas ses tarifs ?", texte: [
        `C'est le cas de ${SANS_TARIF} écoles sur ${etablissements.length}. Ce n'est pas nécessairement un mauvais signe : beaucoup communiquent leurs tarifs par courriel ou en rendez-vous. Mais tant que tu n'as pas de montant écrit, tu n'as pas de prix.`,
        "Demande-les par écrit, et pose ces six questions dans le même message :",
      ], liste: [
        "Quel est le montant de la scolarité pour l'année et pour la filière qui m'intéresse ?",
        "Quels frais s'ajoutent (inscription, dossier, assurance scolaire, concours d'entrée) ?",
        "Le tarif change-t-il d'une année à l'autre du cursus, et de combien a-t-il augmenté ces trois dernières années ?",
        "Le paiement peut-il être échelonné, et selon quel calendrier ?",
        "Le tarif est-il le même pour un étudiant étranger ?",
        "La filière est-elle accréditée, et jusqu'à quelle date ? Quel est le numéro de l'arrêté ?",
      ] },
      { titre: "Faire baisser la facture", liste: [
        "Les bourses et réductions des écoles : beaucoup en annoncent sur leur propre site (mérite, situation sociale, prise en charge partielle ou totale). Elles sont rassemblées sur la page Bourses de Navigoal.",
        "La ville : à formation égale, le logement et la vie quotidienne coûtent nettement moins cher hors de Casablanca et de Rabat. Les pages villes donnent le budget mensuel de chacune.",
        "La colocation plutôt que le studio, surtout la première année.",
        "Les abonnements étudiants de transport, deux fois moins chers que le tarif normal (voir le guide des transports).",
        "L'échelonnement : demande-le avant de signer, il se négocie plus difficilement après.",
      ] },
      { titre: "Vérifier avant de payer", liste: [
        "Que la filière est accréditée : la fiche Navigoal de chaque école affiche le statut de chaque filière et la date d'échéance de son accréditation.",
        "Que le moyen de paiement est celui de l'école : sur Navigoal, les moyens de paiement déclarés par une école ne s'affichent qu'après vérification par notre équipe.",
        "Ne verse jamais d'argent sur un compte personnel, ni à un intermédiaire qui promet une admission.",
        "Navigoal n'encaisse aucun frais de scolarité et ne prend aucune commission sur les candidatures, qui sont gratuites.",
      ] },
    ],
    sources: [
      "Tarifs publiés par les établissements sur leurs sites officiels, relevés et vérifiés par Navigoal.",
      `Relevé portant sur les ${etablissements.length} établissements privés du référentiel Navigoal ; ${PUBLIENT.length} publient un tarif.`,
      "Listes du ministère de l'Enseignement supérieur, de la Recherche scientifique et de l'Innovation (Maroc) et arrêtés d'accréditation publiés au Bulletin officiel.",
    ],
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
      { titre: "Budget", texte: [`Compte ${aPartir(B.lignes[0])}${mad(B.lignes[0].min)} par mois pour le logement (studio ou colocation). ${B.note}`, "À l'entrée, prévois en général une caution (souvent un à deux mois de loyer) et le premier mois payé d'avance."] },
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
      { titre: "Le coût de la vie par mois", liste: B.lignes.map((l) => `${l.poste} : ${aPartir(l)}${mad(l.min)}`).concat([`Total : ${aPartir(B.total_mensuel)}${mad(B.total_mensuel.min)} par mois. ${B.note}`]) },
      { titre: "Les frais de scolarité", texte: [`Dans le privé : ${aPartir(MA.frais_prive)}${mad(MA.frais_prive.min)} ${MA.frais_prive.unite}. ${MA.frais_prive.note}`, "Ajoute les frais d'inscription et de dossier, publiés sur la fiche de l'établissement quand ils sont connus."] },
      { titre: "L'installation", liste: ["Billet d'avion aller-retour.", "Visa ou e-Visa selon la nationalité, puis carte de séjour (timbre, photos, copies).", "Caution et premier mois de loyer.", "Assurance santé (obligatoire pour la carte de séjour).", "Équipement : ordinateur, fournitures, téléphone."] },
      { titre: "Nos conseils", liste: ["Garde une réserve pour les imprévus (environ un mois de dépenses).", "Les taux de change varient : Navigoal ajoute une marge de prudence de 3 % aux conversions.", "Utilise le devis parents pour obtenir le coût total sur toute la durée des études."] },
    ],
  },
  {
    slug: "transport-etudiant-maroc", titre: "Tram, bus et train au Maroc : abonnements étudiants et prix", type: "guide", theme: "vie", format: "page", publics: ["etudiant", "parent"], href: "/ressources/transport-etudiant-maroc/", photo: "tramway", icone: "tram-front", couleur: "#0e7490", lecture: 5,
    resume: "Abonnements étudiants du tram, du busway, des bus et du train ONCF : prix officiels, pièces à fournir et où les obtenir (vérifié le 20 novembre 2026).",
    sections: [
      { titre: "L'essentiel", liste: [
        "Les abonnements étudiants coûtent de 100 à 160 DH par mois en ville, contre 230 à 300 DH en tarif normal.",
        "Ils sont presque tous réservés aux moins de 26 ans et demandent une attestation d'inscription de l'année en cours : demande-la à ton école dès la rentrée.",
        "Les formulaires parlent de « CIN » : en tant qu'étranger, présente ton passeport et ta carte de séjour (ou son récépissé), et vérifie en agence qu'ils sont acceptés.",
        "Tarifs relevés sur les sites officiels des opérateurs le 20 novembre 2026. Ils changent (hausse à Rabat en juillet 2025) : vérifie avant de payer.",
      ] },
      { titre: "Casablanca : tramway et busway", texte: ["Un seul titre pour le tram et le busway, avec correspondance gratuite sur tout le réseau (Casatramway, RATP Dev)."], liste: [
        "Ticket : 8 DH le voyage, 14 DH les deux. Carte rechargeable : 6 DH le voyage (carte à 15 DH, valable 5 ans).",
        "Abonnement mensuel tout public : 230 DH. Abonnement hebdomadaire : 60 DH.",
        "Abonnement étudiant (moins de 26 ans) : 150 DH pour 30 jours illimités à partir de la première validation, plus 15 DH pour la carte.",
        "Pièces : formulaire rempli, pièce d'identité, certificat de scolarité original (ou copie légalisée), une photo. Pour une école privée, le certificat doit venir d'un établissement homologué par le ministère de l'Enseignement supérieur.",
        "Où : agences commerciales Casatramway ; recharge en station, en agence, chez les revendeurs ou à l'e-boutique.",
      ] },
      { titre: "Casablanca : bus Casabus", liste: [
        "Ticket : 5 DH sur la plupart des lignes (6 à 8 DH en banlieue). Navette Casa-Port – aéroport Mohammed V (L001) : 50 DH.",
        "La carte étudiant Casabus (100 DH par mois + 100 DH d'inscription) est réservée à l'enseignement public. Dans une école privée, prends l'abonnement étudiant du tram et du busway.",
      ] },
      { titre: "Rabat, Salé et Témara : tramway", liste: [
        "Ticket : 7 DH depuis le 1er juillet 2025, aussi dans l'application Tram Mobile. Ticket tram + bus ligne 30 (Témara) : 10 DH. Amende sans titre : 50 DH.",
        "Abonnement étudiant « Irtiyah Talib » (moins de 26 ans, public et privé) : 160 DH par mois, 450 DH le trimestre, 860 DH le semestre, 1 600 DH l'année.",
        "Tout public « Irtiyah » : 270 DH par mois.",
        "Le plus simple : l'application Tram Mobile (attestation d'inscription, pièce d'identité recto verso, photo). En agence : formulaire signé et cacheté par l'école.",
        "Seules les écoles privées « conventionnées » ouvrent droit au tarif étudiant : la liste est en agence commerciale, demande-la avant de payer.",
      ] },
      { titre: "Rabat et autres villes : bus Alsa", liste: [
        "Rabat, Salé, Témara : abonnement tout public 260 DH par mois (zone 1) ou 300 DH (tout le réseau), plus 40 DH pour la carte.",
        "Carte étudiant Alsa à Rabat : demande en ligne sur alsa.ma, puis rendez-vous en agence (Salé, Témara, Bab Chellah). Le prix n'est pas publié : demande-le en agence.",
        "Alsa propose aussi une carte étudiant à Tanger, Marrakech et Agadir (dossier, photo, attestation d'inscription, dépôt en agence). Prix non publiés sur le site officiel.",
        "Fès : nouveau réseau Issal Fès depuis décembre 2025. Meknès, Oujda, Kénitra : renseigne-toi auprès de l'opérateur en arrivant.",
      ] },
      { titre: "Le train ONCF", liste: [
        "Carte Attalib (étudiants de moins de 26 ans) : 30 % de réduction en 2e classe pendant 12 mois. À demander en gare : formulaire, pièce d'identité, photo, attestation d'inscription de l'année.",
        "Carte Jeune (16 à 30 ans) : 20 % de réduction pendant 12 mois, avec une pièce d'identité et une photo.",
        "Abonnement « Navette Étudiant » (moins de 28 ans, trajet domicile-études) par mois : Rabat–Kénitra 450 DH, Fès–Meknès 450 DH, Casablanca–Berrechid 400 DH, Casablanca–El Jadida 480 DH, Casablanca–Settat 620 DH. Moins cher sur 3, 6 ou 12 mois.",
        "Billets : site et application « ONCF Voyages », guichets en gare. Service client : 2255.",
        "Le prix des cartes Attalib et Jeune n'est pas publié sur le site de l'ONCF : demande-le au guichet.",
      ] },
      { titre: "Taxis et VTC", liste: [
        "Petits taxis : en ville, le compteur est obligatoire. Demande-le dès le départ.",
        "Uber fonctionne de nouveau depuis le 27 novembre 2025 à Casablanca et Marrakech, uniquement avec des véhicules agréés.",
        "Les autres applications de chauffeurs particuliers n'ont pas de statut officiel : préfère les petits taxis et les véhicules agréés.",
      ] },
    ],
    sources: [
      "Casatramway, offres et abonnement étudiant : https://www.casatramway.ma/ticket-abonnement/nos-offres",
      "Casabus, tarifs et carte étudiant : https://www.casabus.ma/titres-de-transport/tarifs/",
      "Tramway de Rabat-Salé, abonnements (page du 26/08/2025) : https://www.tram-way.ma/fr/abonnement/",
      "Alsa Rabat, espace tout public et étudiant : https://www.alsa.ma/rabat/espace-tout-public",
      "ONCF, carte Attalib, Carte Jeune et Navette Étudiant : https://www.oncf-voyages.ma/navette-etudiant",
      "Uber Maroc (27/11/2025) : https://www.uber.com/ma/fr/newsroom/uber-in-morocco/",
      "Relevé effectué par Navigoal le 20 novembre 2026.",
    ],
  },
  {
    slug: "argent-banque-paiement-maroc", titre: "Payer, envoyer de l'argent et ouvrir un compte au Maroc", type: "guide", theme: "vie", format: "page", publics: ["etudiant", "parent"], href: "/ressources/argent-banque-paiement-maroc/", photo: "finance", icone: "credit-card", couleur: "#0f8a46", lecture: 6,
    resume: "Cartes étrangères, paiement CMI, portefeuilles mobiles, transferts depuis la zone CFA, plafonds BEAC et comptes bancaires : ce qu'il faut savoir avant le départ.",
    sections: [
      { titre: "L'essentiel", liste: [
        "À l'arrivée, une carte Visa ou Mastercard de ton pays suffit pour retirer au distributeur et payer en magasin. Garde une réserve en espèces les premiers jours.",
        "Pour la suite, l'argent des parents arrive par virement sur un compte au Maroc, ou en espèces chez un agent de transfert (Wafacash, Cash Plus, Western Union, MoneyGram).",
        "Parents de la zone CEMAC : les paiements par carte hors de la zone sont plafonnés et demandent des justificatifs (voir plus bas).",
        "Programme un rappel avant chaque loyer et chaque échéance de scolarité dans ton espace Navigoal (« Rappels de paiement ») : 2, 3, 5 ou 7 jours avant.",
      ] },
      { titre: "Payer par carte : le CMI", texte: [
        "Au Maroc, les terminaux de paiement des commerçants et le paiement en ligne de nombreuses écoles passent par le CMI (Centre monétique interbancaire). Les pages de paiement CMI acceptent les cartes Visa et Mastercard, y compris les cartes émises à l'étranger dans la pratique.",
        "Depuis le 1er mai 2025, le CMI n'a plus le monopole : d'autres établissements de paiement peuvent encaisser les cartes. Chaque école choisit son moyen d'encaissement : vérifie sur sa fiche Navigoal les moyens de paiement qu'elle a déclarés et que notre équipe a vérifiés.",
      ] },
      { titre: "Retirer avec une carte étrangère", liste: [
        "Les distributeurs limitent souvent chaque retrait à environ 2 000 DH ; tu peux faire plusieurs retraits.",
        "Les frais dépendent surtout de ta banque : commission sur les opérations à l'étranger et taux de change. Renseigne-toi avant de partir.",
        "Préviens ta banque de ton départ pour éviter un blocage de la carte.",
      ] },
      { titre: "Portefeuilles mobiles et « Maroc Pay »", liste: [
        "Les portefeuilles mobiles (applications des banques, Barid Bank Mobile, opérateurs télécoms, Wafacash…) servent à payer chez les commerçants « Maroc Pay » par QR code, sans frais pour le payeur, et à envoyer de l'argent à un numéro de téléphone.",
        "Trois plafonds fixés par Bank Al-Maghrib : 200 DH avec le seul numéro de téléphone, 5 000 DH avec une pièce d'identité photographiée, 20 000 DH après passage en agence.",
        "Le guide officiel parle de « CIN » : en tant qu'étranger, vérifie auprès de l'opérateur qu'il accepte ton passeport ou ta carte de séjour.",
      ] },
      { titre: "Recevoir de l'argent de la famille", liste: [
        "En espèces : Cash Plus, Wafacash, Al Barid Bank, Chaabi Cash et d'autres agents versent les transferts Western Union, MoneyGram ou Ria, sur présentation d'une pièce d'identité et du code de la transaction.",
        "Depuis le Cameroun, Wafacash (filiale d'Attijariwafa bank) est présent sur place. Depuis le Gabon, le Congo ou la zone UEMOA, compare Western Union et MoneyGram : les frais varient selon le pays et le montant.",
        "Wise et Taptap Send n'envoient pas depuis le franc CFA : utiles seulement si la famille a un compte en euros ou en dollars.",
        "Par virement bancaire international : moins cher pour les gros montants (scolarité), à condition d'avoir un compte au Maroc ou de payer directement le compte de l'école.",
      ] },
      { titre: "Parents de la zone CEMAC : les règles de la BEAC", liste: [
        "Les transferts pour études sont autorisés, à condition de justifier l'origine des fonds et le motif (pièces listées par la BEAC pour « études scolaires et universitaires »).",
        "Paiement en ligne avec une carte émise en CEMAC : jusqu'à 1 million de F CFA par mois sans justificatif. Au-delà, pour des frais de scolarité : certificat de scolarité ou carte d'étudiant, copie du passeport de l'étudiant et preuve du lien de parenté, à fournir sous 30 jours.",
        "Carte utilisée hors CEMAC par un étudiant : jusqu'à 2 millions de F CFA par mois, avec une preuve de voyage. La carte ne doit être utilisée que par son titulaire.",
        "Pour les gros montants (scolarité annuelle), le virement bancaire avec dossier justificatif reste la voie la plus sûre. Zone UEMOA : demande les règles équivalentes à ta banque.",
      ] },
      { titre: "Ouvrir un compte bancaire au Maroc", liste: [
        "Les étrangers peuvent ouvrir un compte en dirhams ordinaire ou un compte en devises ou en « dirhams convertibles ».",
        "Le compte en dirhams convertibles est alimenté par des virements de l'étranger ou des devises déclarées ; son solde peut être renvoyé librement à l'étranger. Pratique pour récupérer le reste en fin d'études.",
        "Un compte en dirhams ordinaire n'est pas transférable à l'étranger.",
        "Aucune banque marocaine ne publie d'offre réservée aux étudiants étrangers. Les principales (Attijariwafa bank, Bank of Africa, Banque Populaire, CIH Bank, Crédit Agricole du Maroc, Al Barid Bank, Société Générale) ont des offres étudiants : compare-les en agence.",
        "Pièces à prévoir : passeport, carte de séjour ou récépissé, attestation d'inscription, justificatif de domicile (bail) et parfois justificatif de l'origine des fonds. Les délais varient : demande-les en agence.",
      ] },
    ],
    sources: [
      "Bank Al-Maghrib, guide du paiement mobile au Maroc : https://www.bkam.ma/content/download/731702/8352332/Guide%20Paiement%20mobile%C2%A0au%20Maroc_FR.pdf",
      "Conseil de la concurrence, fin du monopole du CMI (19/05/2025) : https://conseil-concurrence.ma/communique-de-conseil-de-la-concurrence/",
      "Cash Plus, transfert d'argent international : https://www.cashplus.ma/services/transfert-argent-international",
      "MoneyGram, envoi vers le Maroc : https://www.moneygram.com/fr/fr/corridor/maroc",
      "Wise, devises d'envoi : https://wise.com/help/articles/2571907/what-currencies-can-i-send-to-and-from",
      "BEAC, lettre circulaire n° 002/GR/2022 (pièces par motif) : https://www.beac.int/wp-content/uploads/2022/05/lettre-Circulaire-N%C2%B0002-GR-2022_1.pdf",
      "BEAC, lettre circulaire n° 004/GR/2022 (cartes), résumée par Société Générale Cameroun : https://particuliers.societegenerale.cm/fr/news/news-details/news/lettre-circulaire-beac-004gr2022/",
      "Office des changes, étrangers non-résidents : https://www.oc.gov.ma/fr/particuliers/etrangers-non-residents",
      "Relevé effectué par Navigoal le 20 novembre 2026.",
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
