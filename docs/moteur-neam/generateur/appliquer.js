// Applique le contenu propre à chaque entreprise (projets.js) sur le contenu générique du secteur.
const J = require('./projets');
const { hash } = require('./lib');

const ROOT = '../../assets/';
const url = (ref) => { const f = J.photo(ref); return f ? (f.startsWith('sig/') ? ROOT + f : ROOT + 'photos/' + f) : null; };

// Éléments (titre, description, prix, photo) de l'offre principale, quel que soit le secteur
function offre(j) {
  if (j.menu) return Object.values(j.menu).flat().map(([t, d, pr, ph]) => ({ t, d, pr, ph }));
  if (j.rooms) return j.rooms.map((r) => ({ t: r.t, d: r.d, pr: r.pr, ph: r.ph[0] }));
  if (j.cats) return Object.entries(j.cats).flatMap(([k, l]) => l.map(([t, d, pr], i) => ({ t, d, pr, ph: i === 0 ? j.catPh?.[k] : null })));
  if (j.picks) return j.picks.map((k) => J.LIST[k]).map((l) => ({ t: l.t, d: `${l.typ} · ${l.m2} m²`, pr: l.pr, ph: l.ph[0] }));
  if (j.services) return j.services.map(([, t, d, ph]) => ({ t, d, ph }));
  if (j.dest) return j.dest.map((x) => ({ t: x.t, d: x.d, pr: x.pr, ph: x.ph }));
  if (j.forms) return j.forms.map((x) => ({ t: x.t, d: x.d, pr: x.pr, ph: x.ph }));
  if (j.products) return j.products.map((x) => ({ t: x.t, d: x.d, pr: x.pr, ph: x.ph }));
  if (j.items) return j.items.map(([t, d, pr, ph]) => ({ t, d, pr, ph }));
  if (j.focus) return J.PARTS.map(([t, k, pr, ph]) => ({ t, d: k, pr, ph }));
  return [];
}

// Photos d'ambiance exactes du métier, pour compléter une galerie trop courte
const CONTEXT = {
  sante: ['accueil-clinique', 'medecin', 'tension', 'infirmiere'],
  biolab: ['microscope', 'infirmiere', 'accueil-clinique', 'tension', 'medecin'],
  'cabinet-de-radiologie-cimel': ['radio#1', 'radio#2', 'radio#3', 'scanner#1', 'scanner#2', 'accueil-clinique'],
  'cabinet-dentaire-demel': ['cabinet-dentaire', 'dentiste#1', 'dentiste#2', 'dentiste-enfant', 'accueil-clinique'],
  'cabinet-dentaire-avicenne': ['implant#1', 'implant#2', 'implant#3', 'cabinet-dentaire', 'dentiste#2'],
  'cabinet-dentaire-acae-sourire': ['dentiste-enfant', 'dentiste#1', 'dentiste#2', 'cabinet-dentaire'],
  'cabinet-dentaire-dr-abbas': ['cabinet-dentaire', 'dentiste#1', 'dentiste#2', 'implant#2', 'accueil-clinique'],
  services: ['open-space', 'poignee-main', 'equipe-afrique', 'bureau-couloir'],
  'agex-vtc': ['chauffeur#1', 'chauffeur#2', 'avion', 'poignee-main', 'land-cruiser#1'],
  immo: ['salon-maison#2', 'salon-maison#4', 'cuisine-appart#1', 'villa#2', 'residence#1', 'cles'],
  voyage: ['avion', 'passeport', 'voyage'],
  auto: ['mecanicien#1', 'mecanicien#2', 'garage', 'moteur'],
  franstel: ['conduite#1', 'conduite#2', 'citadine#1', 'citadine#2'],
  '2s-confort-driving': ['conduite#1', 'conduite#2', 'citadine#2', 'chauffeur#1'],
  'ab-location': ['land-cruiser#1', 'land-cruiser#2', 'hilux#1', 'hilux#2', 'hilux#3', 'citadine#1'],
};

// Présentation de l'entreprise quand aucun texte propre n'est écrit
function about(p, b, c, j) {
  const n = p.n, v = p.c, s = (p.s + ' ' + p.n).toLowerCase(), yr = 3 + (hash(b.slug) % 14);
  const dir = p.d ? ` Sous la direction de ${p.d.replace(/\s*\(.*\)$/, '')}, l'équipe` : ' L\'équipe';
  if (p.k === 'immo') return { agence: `${n} accompagne depuis ${yr} ans particuliers et investisseurs à ${v} : recherche du bien, visites, négociation et suivi jusqu'à la remise des clés.`, sci: `${n} gère son propre patrimoine de logements et de bureaux à ${v}. Les biens sont loués en direct, sans frais d'agence, entretenus et gardiennés.`, expertise: `${n} réalise des expertises immobilières indépendantes à ${v} : valeur vénale, évaluations bancaires et expertises judiciaires, avec des rapports clairs et argumentés.`, gestion: `${n} gère pour le compte des propriétaires des appartements, villas et bureaux à ${v} : recherche de locataires, encaissement des loyers, entretien et compte rendu mensuel.` }[j.mode || 'agence'];
  if (p.k === 'sante') return `${n} reçoit ses patients à ${v} dans un cadre moderne et rassurant.${dir} privilégie l'écoute, des explications claires et un suivi régulier.`;
  if (p.k === 'voyage') return /p[êe]che|fishing/.test(s) ? `${n} réunit les passionnés de pêche sportive au Gabon : sorties en mer, estuaires et séjours en lodge, encadrés par des capitaines expérimentés.` : /[ée]co|aventure|batrhotour|tourisme/.test(s) && !/agence/.test(s) ? `${n} fait découvrir le Gabon autrement : parcs nationaux, faune, forêts et rivières, avec des guides locaux et des hébergements sélectionnés.` : `${n} organise depuis ${v} des voyages sur mesure : billets, hôtels, visas et excursions. Chaque voyageur a un conseiller dédié, joignable sur WhatsApp avant, pendant et après le séjour.`;
  if (p.k === 'auto') return { ecole: `${n} forme les futurs conducteurs à ${v} avec des moniteurs diplômés et des véhicules récents, du code de la route jusqu'à l'examen.`, garage: `${n} entretient et répare tous les véhicules à ${v} : diagnostic, mécanique, freinage et pneus, avec un devis validé avant chaque intervention.`, pieces: `${n} fournit à ${v} des pièces détachées neuves et garanties${j.focus ? ' (' + j.focus.toLowerCase() + ')' : ''}. Les commandes passées avant midi sont prêtes dans la journée.`, loc: `${n} loue à ${v} des véhicules récents et entretenus, avec ou sans chauffeur, pour une journée comme pour un mois.` }[c.mode] || '';
  if (p.k === 'ecole') return /musique|music/.test(s) ? `${n} transmet la passion de la musique à ${v}, aux enfants comme aux adultes : cours individuels ou en petits groupes, auditions et concerts d'élèves.` : /langue/.test(s) ? `${n} fait progresser élèves, étudiants et professionnels en langues étrangères à ${v}, en petits groupes et avec des enseignants expérimentés.` : /h[ôo]teli/.test(s) ? `${n} forme aux métiers de l'hôtellerie et de la restauration, avec des cours pratiques et des stages dans les hôtels partenaires.` : `${n} forme les cadres de demain à ${v}, avec des enseignants issus de l'entreprise et des stages dans les grandes sociétés du pays.`;
  if (p.k === 'luxe') return `${n} accompagne chaque client à ${v} avec des conseils personnalisés, en boutique comme sur rendez-vous privé.`;
  if (p.k === 'boutique') return /fleur/.test(s) ? `${n} compose bouquets et décorations florales à ${v}, pour offrir, célébrer ou décorer. Livraison le jour même.` : /jouet/.test(s) ? `${n} sélectionne des jouets sûrs et durables pour tous les âges, de l'éveil aux jeux de société.` : /artisanat/.test(s) ? `${n} réunit le travail d'artisans gabonais : sculpteurs, vanniers et tisserands. Chaque pièce est faite à la main.` : `${n} propose à ${v} des idées cadeaux et des objets de décoration choisis avec soin, emballés et livrés.`;
  if (p.k === 'services') return /vtc/.test(s) ? `${n} assure vos déplacements à ${v} avec des chauffeurs professionnels et des véhicules climatisés, de jour comme de nuit.` : `${n} accompagne les entreprises de ${v} dans la santé et la sécurité au travail : visites médicales, prévention et formations.`;
  return '';
}

function apply(p, b, c) {
  const j = J.get(b.slug);
  if (!j) return;
  c.J = j;
  for (const k of ['tagline', 'intro', 'about', 'cta']) if (j[k]) c[k] = j[k];
  if (!c.about) c.about = about(p, b, c, j) || undefined;
  const off = offre(j);
  if (j.services) c.items = j.services.map(([i, t]) => [i, t]);
  else if (off.length) c.items = off.map((o) => [o.t, o.d || '', o.pr]);
  if (j.feats) c.feats = j.feats;
  // Photos du site : uniquement celles de l'entreprise, dans un ordre pensé (accueil, visuel secondaire, galerie, offre)
  const ctx = CONTEXT[b.slug] || CONTEXT[p.k] || [];
  const refs = [j.hero, j.side, ...(j.gallery || []), ...off.map((o) => o.ph), ...ctx].filter(Boolean);
  const list = [...new Set(refs.map(url).filter(Boolean))];
  while (list.length && list.length < 6) list.push(list[list.length % Math.max(1, list.length)]);
  if (list.length) b.photos = list;
  b.gallery = [...new Set((j.gallery || refs).concat(ctx).map(url).filter(Boolean))].slice(0, 12);
  // Publications réseaux : chaque élément avec sa propre photo
  c.feed = off.filter((o) => o.ph).map((o) => ({ img: url(o.ph).replace('../../', ''), t: o.t, d: o.d, pr: o.pr }));
  c.ambiance = b.gallery.map((u) => u.replace('../../', ''));
  c.seed = hash(b.slug);
}

module.exports = { apply, url, offre };
