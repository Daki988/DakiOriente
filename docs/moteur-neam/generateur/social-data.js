// Contenu des réseaux sociaux de chaque prospect : publications, légendes, commentaires, stories, offres d'emploi.
const { hash, fcfa, itemTitle, itemSub } = require('./lib');

const USERS = ['marie.nguema', 'junior_mba', 'lyne.ondo', 'kevin.obame', 'stessy_241', 'paola.moussavou', 'fabrice.ella', 'nadia.essono', 'chris_mboumba', 'grace.oyane', 'yannick.nze', 'sandra_lbv', 'cedric.mintsa', 'audrey.bekale', 'loic.ndong', 'merveille.koumba'];
const NAMES = { 'marie.nguema': 'Marie Nguema', junior_mba: 'Junior Mba', 'lyne.ondo': 'Lyne Ondo', 'kevin.obame': 'Kévin Obame', stessy_241: 'Stessy M.', 'paola.moussavou': 'Paola Moussavou', 'fabrice.ella': 'Fabrice Ella', 'nadia.essono': 'Nadia Essono', chris_mboumba: 'Chris Mboumba', 'grace.oyane': 'Grace Oyane', 'yannick.nze': 'Yannick Nze', sandra_lbv: 'Sandra B.', 'cedric.mintsa': 'Cédric Mintsa', 'audrey.bekale': 'Audrey Bekale', 'loic.ndong': 'Loïc Ndong', 'merveille.koumba': 'Merveille Koumba' };
const COMMENTS = {
  resto: ['Trop bon 😍', 'On vient ce week-end !', 'Le meilleur de Libreville 🔥', 'Vous livrez à Akanda ?', 'Service au top 👏', 'J\'ai faim rien qu\'à voir 😅'],
  hotel: ['Séjour parfait, merci 🙏', 'Superbe vue !', 'Vous avez de la place pour décembre ?', 'Personnel adorable 👏', 'On reviendra c\'est sûr', 'Magnifique 😍'],
  beaute: ['Résultat incroyable 😍', 'Je prends rendez-vous !', 'Merci pour l\'accueil 🙏', 'Mes ongles n\'ont jamais été aussi beaux', 'Vous êtes ouverts le dimanche ?', '🔥🔥🔥'],
  immo: ['Toujours disponible ?', 'Quel quartier exactement ?', 'Magnifique bien 😍', 'Je vous écris en privé', 'Professionnels et réactifs 👏', 'Il y a un gardien ?'],
  sante: ['Merci docteur 🙏', 'Équipe très professionnelle', 'Vous prenez les assurances ?', 'Rendez-vous pris !', 'Très bonne prise en charge 👏', 'Merci pour les conseils'],
  voyage: ['Je veux partir 😍', 'C\'est combien pour 2 ?', 'Superbe séjour avec vous 🙏', 'Vous faites les visas aussi ?', 'Magnifique 🌍', 'Réservé !'],
  auto: ['Prix imbattables 👏', 'Vous avez pour Hilux 2018 ?', 'Service rapide merci', 'Je passe demain', 'Pro et honnêtes 🙏', 'Top !'],
  ecole: ['Mon fils adore 🎵', 'Les inscriptions sont ouvertes ?', 'Bravo aux élèves 👏', 'Excellente école', 'Quels sont les horaires ?', 'Fier de vous !'],
  luxe: ['Sublime 😍', 'Je veux la même !', 'Vous livrez à Port-Gentil ?', 'Prix svp ?', 'Magnifique travail 👏', 'Coup de cœur ❤️'],
  boutique: ['Trop mignon 😍', 'Livraison possible ?', 'Je commande !', 'Idée cadeau parfaite 🎁', 'Merci, ma fille a adoré', 'Prix ?'],
  services: ['Très professionnels 👏', 'Merci pour votre réactivité', 'Je recommande', 'Vous intervenez à Owendo ?', 'Excellent service', 'Bravo à l\'équipe'],
};
const TAGS = { resto: ['#Libreville', '#Gabon', '#food', '#restaurant241', '#bonplanLBV'], hotel: ['#Gabon', '#hotel', '#voyage', '#séjour', '#visitgabon'], beaute: ['#beauté', '#Libreville', '#soins', '#selfcare', '#beautyGabon'], immo: ['#immobilier', '#Libreville', '#Gabon', '#location', '#villa'], sante: ['#santé', '#Libreville', '#prévention', '#Gabon'], voyage: ['#voyage', '#Gabon', '#travel', '#evasion', '#visitgabon'], auto: ['#auto', '#Gabon', '#Libreville', '#voiture'], ecole: ['#formation', '#Gabon', '#éducation', '#Libreville'], luxe: ['#mode', '#luxe', '#Libreville', '#madeinGabon'], boutique: ['#shopping', '#Libreville', '#cadeau', '#Gabon'], services: ['#entreprise', '#Gabon', '#Libreville', '#pro'] };

const pick = (arr, n) => arr[Math.abs(n) % arr.length];
const DAYS = ['il y a 2 heures', 'il y a 1 jour', 'il y a 2 jours', 'il y a 3 jours', 'il y a 5 jours', 'il y a 1 semaine', 'il y a 1 semaine', 'il y a 2 semaines', 'il y a 2 semaines', 'il y a 3 semaines', 'il y a 1 mois', 'il y a 1 mois'];

function captions(p, b, c) {
  const n = b.main, city = p.c, tel = p.t, items = c.items.map((it) => ({ t: itemTitle(it), d: itemSub(it), pr: Array.isArray(it) && typeof it[2] === 'number' ? fcfa(it[2]) : '' }));
  const it = (i) => items[i % items.length];
  const S = {
    resto: [`🍽️ ${it(0).t} — ${it(0).d}. ${it(0).pr ? 'Seulement ' + it(0).pr + ' !' : ''} On vous attend chez ${n} 😋`, `Le week-end commence ici 🔥 Réservez votre table au ${tel}.`, `Nouveau à la carte : ${it(1).t} ✨ ${it(1).d}.`, `Ambiance du samedi soir chez ${n} 🎶 Merci à tous d'être venus !`, `En cuisine dès 9 h pour vous servir des produits frais du marché 👨🏾‍🍳`, `${it(2).t} : notre coup de cœur de la semaine ❤️`, `Commandez à emporter sur WhatsApp : ${tel} 📲`, `Merci pour vos ${p.v || 'nombreux'} avis ⭐ Votre confiance nous porte !`],
    hotel: [`Réveil face au jardin ☀️ Bienvenue à ${n}, ${city}.`, `${it(0).t} : ${it(0).d}. À partir de ${it(0).pr} la nuit.`, `Notre piscine vous attend pour la pause de midi 🏊🏾`, `Petit-déjeuner local inclus pour tous nos clients 🥐🥭`, `Séminaire, mariage, anniversaire : nos salles sont à votre disposition 🎉`, `${it(2).t} : l'espace et le calme pour vos séjours d'affaires.`, `Réservez en direct au ${tel} : meilleur prix garanti ✅`, `Merci pour vos avis ⭐ À très vite à ${city} !`],
    beaute: [`${it(0).t} ✨ ${it(0).d}. ${it(0).pr}`, `Avant / après : un éclat qui se voit 😍 Prenez rendez-vous au ${tel}.`, `Votre moment de détente commence ici 🌿`, `Nouveau soin à la carte : ${it(1).t} 💆🏾‍♀️`, `L'équipe ${n} vous souhaite une belle semaine 💕`, `Hygiène irréprochable : matériel stérilisé à chaque cliente ✅`, `Offre du mois : -15 % sur ${it(2).t.toLowerCase()} 🎁`, `Merci pour votre confiance, mesdames 🙏`],
    immo: [`🏡 À VENDRE — ${it(0).t}, ${it(0).d}. ${it(0).pr}.`, `🔑 À LOUER — ${it(1).t}. Visite sur rendez-vous au ${tel}.`, `Nouveau bien en exclusivité : ${it(2).t} ✨`, `Vous vendez ? Estimation gratuite en 48 h 📊`, `Clés remises à une famille heureuse 🔑❤️ Merci pour votre confiance !`, `Gestion locative : on s'occupe de tout, vous encaissez 💼`, `Visite virtuelle disponible sur demande 📲`, `${n} : ${c.tagline}.`],
    sante: [`${c.tagline} 🩺 ${n}, ${city}.`, `Prenez rendez-vous en ligne ou au ${tel} 📅`, `Conseil prévention : un contrôle par an, c'est la base ✅`, `Notre équipe se forme en continu pour mieux vous soigner 👩🏾‍⚕️`, `${it(1).t} : parlons-en lors de votre prochaine consultation.`, `Matériel moderne, protocoles d'hygiène stricts 🧼`, `Horaires : ${c.hours[1]}`, `Merci à nos patients pour leur confiance 🙏`],
    voyage: [`✈️ ${it(0).t} — ${it(0).d}. À partir de ${it(0).pr} !`, `Vos vacances de fin d'année se préparent maintenant 🎄✈️`, `🌍 ${it(1).t} : ${it(1).d}.`, `Visa, billet, hôtel : on s'occupe de tout 📋`, `Retour de mission : nos clients sont rentrés ravis 😍`, `${it(2).t}, ça vous tente ? Devis gratuit au ${tel}.`, `Le Gabon a tant à offrir 🐘🌊`, `Paiement en plusieurs fois possible ✅`],
    auto: [`${it(0).t} : ${it(0).d}. ${it(0).pr || ''} 🚗`, `Nouvel arrivage 📦 Passez nous voir à ${city} !`, `${it(1).t} — ${it(1).d}.`, `Rapide, propre, garanti ✅ Appelez le ${tel}.`, `Conseil du jour : vérifiez vos pneus avant la saison des pluies 🌧️`, `Merci à nos clients fidèles 🙏`, `${c.tagline} 🔧`, `Ouvert ${c.hours[1]}`],
    ecole: [`Inscriptions ouvertes 📚 ${it(0).t} : ${it(0).d}.`, `Bravo à nos élèves pour leurs résultats 🎓👏`, `Cours d'essai gratuit ce samedi ✨`, `${it(1).t} : ${it(1).d}.`, `Nos salles sont prêtes pour la rentrée 🏫`, `Rencontre parents-enseignants vendredi à 17 h 👨‍👩‍👧`, `${c.tagline} 💪🏾`, `Renseignements : ${tel}`],
    luxe: [`${it(0).t} ✨ ${it(0).d}. ${it(0).pr}`, `Nouvelle collection disponible en boutique et sur commande 🛍️`, `${it(1).t} : la pièce qu'il vous faut cette saison.`, `Livraison à Libreville et Akanda sous 24 h 🚚`, `Coffret cadeau : l'attention qui marque 🎁`, `Les coulisses de l'atelier 🪡`, `${c.tagline} ✨`, `Commandez par WhatsApp : ${tel}`],
    boutique: [`${it(0).t} 🎁 ${it(0).d}. ${it(0).pr}`, `Nouvel arrivage cette semaine 😍`, `${it(1).t} : ${it(1).d}.`, `Livraison partout à ${city} 🚚`, `Idée cadeau pour la fête des mères 💐`, `Commandez en un message : ${tel} 📲`, `${c.tagline} ✨`, `Merci pour vos commandes 🙏`],
    services: [`${c.tagline} — ${n}, ${city}.`, `${it(0).t} : contactez-nous au ${tel}.`, `Notre équipe sur le terrain cette semaine 💼`, `${it(1).t} : un service pensé pour les entreprises.`, `Devis gratuit sous 24 h ✅`, `Merci à nos partenaires pour leur confiance 🤝`, `Disponibles ${c.hours[1]}`, `Nous recrutons ! Envoyez votre CV 📩`],
  };
  return S[p.k] || S.services;
}

const AMB_TXT = {
  resto: ['La carte vous attend', 'Réservation par WhatsApp', 'Ambiance du soir chez {n} 🔥 Réservez au {t}.', 'Une table vous attend ce week-end chez {n} 🍽️', 'Merci pour vos messages et vos visites ! À très vite chez {n} 🙏'],
  hotel: ['Votre séjour commence ici', 'Réservation directe, meilleur prix garanti', 'Bienvenue chez {n}, {c} ✨ Réservez en direct au {t}.', 'Moment de détente chez {n} ☀️', 'Merci à nos clients pour leurs avis 🙏'],
  beaute: ['Nos soins préférés', 'Rendez-vous en ligne ou au WhatsApp', 'Votre moment rien qu\'à vous chez {n} 🌿 RDV au {t}.', 'L\'équipe {n} vous accueille du lundi au samedi ✨', 'Merci pour votre confiance 💕'],
  immo: ['Nouveaux biens disponibles', 'Visite sur rendez-vous', 'Vous cherchez un bien à {c} ? Appelez-nous au {t} 🔑', 'Visites cette semaine, prenez rendez-vous 📅', 'Merci à nos clients pour leur confiance 🏡'],
  sante: ['Nos spécialités', 'Rendez-vous en ligne', 'Prenez rendez-vous chez {n} au {t} 📅', 'Notre équipe vous accueille à {c} 🩺', 'Conseil prévention : un contrôle par an, c\'est la base ✅'],
  voyage: ['Nos destinations du moment', 'Devis gratuit sous 24 h', 'Votre prochain voyage se prépare avec {n} ✈️ {t}', 'Visa, billet, hôtel : on s\'occupe de tout 📋', 'Merci à nos voyageurs pour leurs photos 📸'],
  auto: ['Notre sélection', 'Demandez votre devis', 'Passez nous voir à {c} ou appelez le {t} 🚗', 'Rapide, propre, garanti ✅', 'Merci à nos clients pour leur fidélité 🙏'],
  ecole: ['Nos formations', 'Inscriptions ouvertes', 'Inscriptions ouvertes chez {n} 📚 Infos au {t}.', 'Cours d\'essai gratuit ce samedi ✨', 'Bravo à nos élèves 🎓👏'],
  luxe: ['La collection', 'Disponible en boutique et sur commande', 'Nouvelle collection chez {n} ✨ Rendez-vous au {t}.', 'Livraison à {c} sous 24 h 🚚', 'Merci pour votre fidélité 🤍'],
  boutique: ['Nos coups de cœur', 'Commande en un message', 'Nouvel arrivage chez {n} 😍 Commandez au {t}.', 'Livraison partout à {c} 🚚', 'Merci pour vos commandes 🙏'],
  services: ['Nos services', 'Devis gratuit', '{n} à votre service à {c} — {t}', 'Notre équipe sur le terrain cette semaine 💼', 'Merci à nos clients pour leur confiance 🤝'],
};

function build(p, b, c, pool, sig) {
  const h = hash(b.slug), k = p.k, caps = captions(p, b, c), tags = TAGS[k] || TAGS.services;
  const tagLine = (i) => [tags[i % tags.length], tags[(i + 2) % tags.length], '#' + b.slug.replace(/-/g, '').slice(0, 16)].join(' ');
  const pics = [...(sig || []), ...pool];
  const posts = [];
  const FI = { f: 0, a: 0 };
  const base = p.so.includes('instagram') ? 120 : 18;
  for (let i = 0; i < 12; i++) {
    const kind = i === 2 || i === 7 ? 'card' : i === 1 || i === 9 ? 'carousel' : i % 4 === 3 ? 'reel' : 'photo';
    let img = pics[i % pics.length];
    let imgs = kind === 'carousel' ? [pics[i % pics.length], pics[(i + 3) % pics.length], pics[(i + 6) % pics.length]] : [img];
    let cap = caps[i % caps.length];
    // Contenu réel de l'entreprise : chaque publication montre l'élément dont elle parle, sans doublon côte à côte
    if (c.feed && c.feed.length) {
      const feed = c.feed, amb = (c.ambiance && c.ambiance.length ? c.ambiance : feed.map((x) => x.img)).filter((u) => !feed.slice(0, 3).some((x) => x.img === u)).concat(c.ambiance || []);
      if (kind === 'card') { imgs = [amb[0]]; }
      else if (kind === 'carousel') { const st = FI.f; imgs = [0, 1, 2].map((q) => feed[(st + q) % feed.length].img); FI.f += 1; cap = `${[0, 1, 2].map((q) => feed[(st + q) % feed.length].t).filter((x, q, a) => a.indexOf(x) === q).join(', ')} : ${(AMB_TXT[k] || AMB_TXT.services)[0].toLowerCase()} chez ${b.main} ✨`; }
      else if (i % 2 === 0 || !amb.length) { const fi = feed[FI.f++ % feed.length]; const price = typeof fi.pr === 'number' ? ' · ' + fcfa(fi.pr) : fi.pr && fi.pr !== '—' ? ' · ' + fi.pr : ''; imgs = [fi.img]; cap = `${fi.t} — ${fi.d}${price}. ${(AMB_TXT[k] || AMB_TXT.services)[1]} 📍 ${p.c}`; }
      else { imgs = [amb[FI.a++ % amb.length]]; cap = (AMB_TXT[k] || AMB_TXT.services)[2 + ((i >> 1) % 3)].replace('{n}', b.main).replace('{t}', p.t).replace('{c}', p.c); }
      if (posts.length && posts[posts.length - 1].imgs[0] === imgs[0] && kind !== 'card') { imgs = [amb[FI.a++ % amb.length] || imgs[0]]; }
      img = imgs[0];
    }
    const likes = Math.round(base * (1 + ((h >> i) % 9) / 3) * (kind === 'reel' ? 3 : 1));
    const ncom = 2 + ((h >> (i + 2)) % 4);
    const comments = Array.from({ length: ncom }, (_, j) => { const u = pick(USERS, h + i * 7 + j * 3); return { u, n: NAMES[u], t: pick(COMMENTS[k] || COMMENTS.services, h + i + j * 5), l: (h >> j) % 12 }; });
    posts.push({ kind, imgs, cap, tags: tagLine(i), likes, comments, date: DAYS[i], views: kind === 'reel' ? likes * 14 : 0 });
  }
  const highlights = { resto: ['Menu', 'Plats', 'Ambiance', 'Avis', 'Accès'], hotel: ['Chambres', 'Piscine', 'Resto', 'Avis', 'Accès'], beaute: ['Soins', 'Avant/Après', 'Tarifs', 'Avis', 'Équipe'], immo: ['À vendre', 'À louer', 'Visites', 'Avis', 'Agence'], sante: ['Soins', 'Équipe', 'Conseils', 'Infos', 'Avis'], voyage: ['Offres', 'Gabon', 'Monde', 'Avis', 'Visas'], auto: ['Services', 'Tarifs', 'Atelier', 'Avis', 'Accès'], ecole: ['Cours', 'Élèves', 'Événements', 'Avis', 'Infos'], luxe: ['Collection', 'Atelier', 'Clients', 'Avis', 'Livraison'], boutique: ['Nouveautés', 'Cadeaux', 'Livraison', 'Avis', 'Boutique'], services: ['Services', 'Équipe', 'Clients', 'Avis', 'Contact'] }[k] || ['À propos'];
  const jobs = { resto: ['Serveur / Serveuse', 'Commis de cuisine'], hotel: ['Réceptionniste', 'Femme / Valet de chambre'], beaute: ['Esthéticienne confirmée', 'Prothésiste ongulaire'], immo: ['Agent immobilier', 'Assistant(e) commercial(e)'], sante: ['Assistant(e) dentaire', 'Secrétaire médical(e)'], voyage: ['Conseiller voyage', 'Agent de billetterie'], auto: ['Mécanicien auto', 'Vendeur pièces détachées'], ecole: ['Professeur', 'Responsable administratif'], luxe: ['Conseiller(ère) de vente', 'Couturier(ère)'], boutique: ['Vendeur(se)', 'Livreur'], services: ['Chargé(e) de clientèle', 'Commercial terrain'] }[k] || ['Commercial'];
  return { posts, highlights, jobs, followers: { ig: p.so.includes('instagram') ? null : 0 } };
}

module.exports = { build, USERS, NAMES };
