// Contenus éditoriaux de démonstration (à remplacer par le CMS / back-office).
export const ACTUALITES = [
  { slug: "bourses-2026", cat: "Bourses", tone: "sun", titre: "Bourses d'études 2026 : 10 opportunités pour les étudiants africains", date: "10 oct. 2026", grad: "from-brand-600 to-brand-400", icon: "award", resume: "Une sélection de bourses disponibles en Afrique et à l'international pour poursuivre vos études." },
  { slug: "choisir-sa-serie", cat: "Orientation", tone: "green", titre: "Comment bien choisir sa série après le BEPC, le BFEM ou le tronc commun ?", date: "08 oct. 2026", grad: "from-[#0f8a46] to-[#34d399]", icon: "compass", resume: "Nos conseils pratiques pour faire le bon choix selon ton profil et ton projet." },
  { slug: "etudier-au-maroc", cat: "International", tone: "violet", titre: "Étudier au Maroc quand on est Gabonais : démarches, coûts et logement", date: "06 oct. 2026", grad: "from-[#6a3df0] to-[#a78bfa]", icon: "plane", resume: "Visa, préinscription, bourses AMCI, budget mensuel et recherche de logement avec Navilease." },
  { slug: "premiere-annee", cat: "Vie étudiante", tone: "rose", titre: "Vie étudiante : 7 conseils pour réussir sa première année", date: "04 oct. 2026", grad: "from-[#d42a50] to-[#fb7185]", icon: "users", resume: "Organisation, méthodes de travail et bonnes habitudes dès la rentrée." },
  { slug: "ia-education", cat: "Innovation", tone: "blue", titre: "L'intelligence artificielle au service de l'éducation en Afrique", date: "03 oct. 2026", grad: "from-[#0e7490] to-[#22d3ee]", icon: "cpu", resume: "De nouvelles solutions pour améliorer l'apprentissage et l'orientation." },
  { slug: "metiers-btp", cat: "Métiers", tone: "sun", titre: "Métiers du bâtiment : des opportunités pour les jeunes africains", date: "29 sept. 2026", grad: "from-[#c2410c] to-[#fb923c]", icon: "hard-hat", resume: "Un secteur en pleine croissance avec de nombreux débouchés, du BTS au diplôme d'ingénieur." },
] as const;

export const TONES: Record<string, string> = {
  sun: "bg-sun-100 text-[#a55a00]", green: "bg-[#e8f8ef] text-[#0f8a46]", violet: "bg-[#f1edff] text-[#6a3df0]",
  rose: "bg-[#ffecef] text-[#d42a50]", blue: "bg-brand-50 text-brand-700",
};

export const LOGEMENTS = [
  { id: "l1", titre: "Studio meublé", quartier: "Agdal, Rabat", pays: "MA", prix: "2 800 MAD", trajet: "8 min · ENSIAS", etab: "ma-ensias", badge: "visite", grad: "from-brand-600 to-brand-400", icon: "building", type: "Studios", note: "4,8" },
  { id: "l2", titre: "Chambre en colocation", quartier: "Fann, Dakar", pays: "SN", prix: "75 000 FCFA", trajet: "6 min · UCAD", etab: "sn-ucad", badge: "identite", grad: "from-[#0f8a46] to-[#34d399]", icon: "users", type: "Colocations", note: "4,7" },
  { id: "l3", titre: "Résidence étudiante privée", quartier: "Maârif, Casablanca", pays: "MA", prix: "3 500 MAD", trajet: "15 min · EHTP", etab: "ma-ehtp", badge: "partenaire", grad: "from-[#6a3df0] to-[#a78bfa]", icon: "hotel", type: "Résidences privées", note: "4,6" },
  { id: "l4", titre: "Chambre chez l'habitant", quartier: "Akébé, Libreville", pays: "GA", prix: "90 000 FCFA", trajet: "10 min · UOB", etab: "ga-uob", badge: "visite", grad: "from-[#c2410c] to-[#fb923c]", icon: "house", type: "Chez l'habitant", note: "4,8" },
  { id: "l5", titre: "Studio", quartier: "Sacré-Cœur, Dakar", pays: "SN", prix: "150 000 FCFA", trajet: "18 min · ESP", etab: "sn-esp", badge: "identite", grad: "from-[#0e7490] to-[#22d3ee]", icon: "building-2", type: "Studios", note: "4,7" },
  { id: "l6", titre: "Appartement 2 chambres (coloc)", quartier: "Guéliz, Marrakech", pays: "MA", prix: "2 200 MAD", trajet: "12 min · UCA", etab: "ma-uca", badge: "partenaire", grad: "from-[#d42a50] to-[#fb7185]", icon: "house", type: "Colocations", note: "4,6" },
  { id: "l7", titre: "Chambre en résidence", quartier: "Franceville centre", pays: "GA", prix: "65 000 FCFA", trajet: "12 min · USTM", etab: "ga-ustm", badge: "identite", grad: "from-[#1336e0] to-[#8eb4ff]", icon: "hotel", type: "Résidences privées", note: "4,5" },
  { id: "l8", titre: "Studio meublé", quartier: "Sanar, Saint-Louis", pays: "SN", prix: "60 000 FCFA", trajet: "5 min · UGB", etab: "sn-ugb", badge: "visite", grad: "from-[#0f8a46] to-[#86efac]", icon: "building", type: "Studios", note: "4,9" },
  { id: "l9", titre: "Colocation 3 chambres", quartier: "Hay Riad, Rabat", pays: "MA", prix: "1 900 MAD", trajet: "14 min · UM5", etab: "ma-um5", badge: "partenaire", grad: "from-[#f9a806] to-[#ffd34a]", icon: "users", type: "Colocations", note: "4,7" },
] as const;

export const BADGES: Record<string, [string, string]> = {
  visite: ["bg-[#e8f8ef] text-[#0f8a46]", "✓ Visité par Navilease"],
  identite: ["bg-brand-50 text-brand-700", "Identité vérifiée"],
  partenaire: ["bg-sun-100 text-[#a55a00]", "★ Partenaire certifié"],
};
