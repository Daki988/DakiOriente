// Digital score NEAM : note actuelle (barème du tableau de prospection), plan d'action et note après accompagnement.
// Chaque recommandation pointe vers l'élément exact qui l'applique dans les pages d'exemple (?hl=sélecteur).
// Barème : site 40, fiche Google 25, Facebook 20, Instagram/TikTok 15.
(function () {
  const MAX = { site: 40, google: 25, facebook: 20, social: 15 };
  const LABEL = { site: 'Site internet', google: 'Fiche Google', facebook: 'Facebook', social: 'Instagram & TikTok' };
  const strip = (s) => String(s || '').replace(/&amp;/g, '&');
  const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

  // Avis et note projetés après accompagnement (repris tels quels dans la fiche Google)
  function proj(p) {
    const h = hash(p.slug);
    return { r: p.r || [4.7, 4.8, 4.9][h % 3], v: p.v ? p.v + 12 + (h % 9) : 14 + (h % 11) };
  }

  function before(p) {
    const so = p.so || [];
    const has = { site: !!p.w, google: p.g === 'Oui', facebook: so.includes('facebook'), social: so.includes('instagram') || so.includes('tiktok') };
    const pts = { site: 0, google: 0, facebook: 0, social: 0 };
    const keys = Object.keys(MAX).filter((k) => has[k]);
    const tot = keys.reduce((a, k) => a + MAX[k], 0);
    let left = p.sc || 0;
    keys.forEach((k, i) => { const v = i === keys.length - 1 ? left : Math.min(MAX[k], Math.round((MAX[k] * (p.sc || 0)) / tot)); pts[k] = Math.min(MAX[k], v); left -= pts[k]; });
    if (left > 0) pts.google = Math.min(MAX.google, pts.google + left); // présence hors barème (annuaires, Tripadvisor)
    return { has, pts, total: Object.values(pts).reduce((a, b) => a + b, 0) };
  }

  function after(p) {
    const h = hash(p.slug);
    const pts = { site: 40 - (h % 3), google: 25 - ((h >> 2) % 2), facebook: 20 - ((h >> 3) % 3), social: 15 - ((h >> 5) % 2) };
    return { pts, total: Object.values(pts).reduce((a, b) => a + b, 0) };
  }

  // Lien vers la page qui applique la recommandation, avec l'élément à surligner
  const L = (path, hl, t, slug) => `${path}${path.includes('?') ? '&' : '?'}hl=${encodeURIComponent(hl)}&ht=${encodeURIComponent(t)}${slug && !/slug=/.test(path) ? '&slug=' + slug : ''}`;

  const PAGE = {
    'carte.html': ['Carte en ligne avec photos, prix et commande envoyée directement sur WhatsApp', '.menu|[data-tabs]|.mi'],
    'reservation.html': ['Réservation en ligne : formulaire, récapitulatif et confirmation par WhatsApp', '[data-calc]|form.form|form'],
    'chambres.html': ['Chaque chambre présentée avec photos, équipements et tarif à la nuit', 'main .sec .g3|main .sec .g2|main .sec'],
    'restaurant.html': ['Page restaurant et bar pour attirer aussi la clientèle extérieure', 'main .sec .g2|main .sec'],
    'soins.html': ['Toutes les prestations avec leurs tarifs, classées par catégorie', '[data-tabs]|.menu|main .sec'],
    'rendez-vous.html': ['Prise de rendez-vous en ligne : prestation, date et créneau horaire', '[data-steps]|form.form|form'],
    'annonces.html': ['Annonces filtrables (vente, location) avec fiche détaillée pour chaque bien', '[data-tabs]|main .sec'],
    'estimer.html': ['Formulaire d\'estimation gratuite pour capter les propriétaires vendeurs', '[data-estimate]|form'],
    'equipe.html': ['Présentation de l\'équipe et des praticiens pour rassurer les patients', 'main .sec .g3|main .sec'],
    'destinations.html': ['Destinations présentées avec photos, durée et prix « à partir de »', 'main .sec .g3|main .sec'],
    'sur-mesure.html': ['Demande de voyage sur mesure avec budget et dates', '[data-budget]|form'],
    'formations.html': ['Catalogue des formations : durée, niveau et tarif', 'main .sec .g3|main .sec'],
    'formules.html': ['Formules et tarifs présentés clairement', 'main .sec .g3|main .sec'],
    'inscription.html': ['Inscription en ligne en quelques étapes', '[data-steps]|form'],
    'boutique.html': ['Boutique en ligne : panier et commande sur WhatsApp', '[data-tabs]|main .sec'],
    'collection.html': ['Collection présentée produit par produit, avec prix', '[data-tabs]|main .sec'],
    'catalogue.html': ['Catalogue de pièces avec demande de prix sur WhatsApp', '[data-tabs]|main .sec'],
    'flotte.html': ['Flotte de véhicules avec photos et tarif à la journée', 'main .sec .g3|main .sec'],
    'services.html': ['Services et tarifs détaillés', 'main .sec .g3|main .sec'],
    'devis.html': ['Demande de devis en ligne, réponse rapide', 'form'],
    'expertises.html': ['Présentation des expertises : valeur vénale, bancaire, judiciaire, avant achat', 'main .sec .g3|main .sec'],
    'demande.html': ['Demande d\'expertise en ligne : type, bien, adresse et échéance', 'form'],
    'residences.html': ['Résidences à louer en direct, avec fiche détaillée de chaque logement', '#biens|main .sec'],
    'louer.html': ['Demande de location en ligne, rappel sous 48 h', 'form'],
    'gestion.html': ['Offre de gestion locative détaillée : locataires, loyers, entretien, compte rendu', 'main .sec .g3|main .sec'],
    'confier.html': ['Formulaire « Confier mon bien » pour recevoir une proposition de gestion', 'form'],
  };

  function plan(p, SD) {
    SD = SD || { posts: [], highlights: [], jobs: [] };
    const b = before(p), slug = p.slug;
    const site = `sites/${slug}/`;
    const nets = p.nets || {};
    const ctaPage = (p.pages || []).find(([f]) => /reserv|rendez|inscri|devis|sur-mesure|contact/.test(f)) || ['contact.html'];
    const metier = (p.pages || []).filter(([f]) => PAGE[f]);
    const names = ['Accueil'].concat((p.pages || []).map(([, t]) => strip(t)));
    const S = (t, d, path, hl) => ({ t, d, url: L(path, hl, t, slug) });
    const verb = b.has.site ? 'Refonte complète du site' : 'Création du site';
    const so = p.so || [];
    const fbBtn = (nets.facebook || {}).btn || p.cta;
    const posts = SD.posts || [];
    const vids = posts.filter((x, i) => i % 2 === 0).length;
    const pr = proj(p);
    const gState = { Oui: 'Fiche existante mais incomplète', 'Non revendiquée': 'Fiche existante non revendiquée : n\'importe qui peut la modifier', 'Non vérifiée': 'Fiche non contrôlée : informations, photos et avis non maîtrisés', 'Non trouvée': 'Aucune fiche Google : l\'établissement est invisible sur Maps' }[p.g] || 'Fiche à créer';

    const R = {
      site: {
        state: b.has.site ? (/refonte/i.test(p.a) ? 'Site existant daté, peu adapté au téléphone et sans réservation' : 'Site existant à optimiser pour convertir') : 'Aucun site internet : les clients ne trouvent ni offre, ni prix, ni moyen de réserver',
        recos: [
          S(`${verb} sur ${p.domain} : ${names.length} pages`, names.join(' · '), site + 'index.html', 'header nav|nav'),
          S(`Bouton « ${strip(p.cta)} » visible en permanence en haut de chaque page`, 'L\'action principale toujours à portée de clic', site + 'index.html', '.hd .btn|nav .cta|nav .pill|nav .book-btn|nav a:last-child'),
          ...metier.map(([f, t]) => S(`Page « ${strip(t)} »`, PAGE[f][0], site + f, PAGE[f][1])),
          S('Bouton WhatsApp flottant sur toutes les pages', `Un clic pour écrire au ${p.t}`, site + 'index.html', '.neam-wa'),
          S('Page Contact : carte Google, horaires, téléphone et formulaire', strip(p.hours[1]), site + 'contact.html', '.map|iframe'),
          S('Galerie photos professionnelle', 'Photos en plein écran, adaptées au téléphone', site + 'galerie.html', '.gal|main .sec'),
          S(`Référencement local pour apparaître sur « ${strip(p.s).toLowerCase()} ${p.c} »`, 'Titre, description et fiche entreprise lisibles par Google', `recherche.html?q=${encodeURIComponent(strip(p.s) + ' ' + p.c)}`, '.res'),
          S('Design responsive : parfait sur téléphone, tablette et ordinateur', 'Ouvrez le site sur votre téléphone pour le constater', site + 'index.html', 'main>section:first-child|section|main'),
        ],
      },
      google: {
        state: gState,
        recos: [
          S({ 'Non trouvée': 'Création et validation de la fiche Google', 'Non revendiquée': 'Revendication et validation de la fiche Google', 'Non vérifiée': 'Validation et reprise en main de la fiche Google' }[p.g] || 'Optimisation complète de la fiche Google', 'Badge « Établissement revendiqué par le propriétaire »', `recherche.html?q=${encodeURIComponent(p.n)}`, '.kp .claim|.kp'),
          S(`Catégorie « ${strip(p.s)} », adresse, téléphone et horaires (${strip(p.hours[1])})`, 'Des informations exactes, mises à jour', `recherche.html?q=${encodeURIComponent(p.n)}`, '.kp .info'),
          S(`Boutons Site Web, Itinéraire, Appeler et « ${strip(p.cta)} »`, `Le bouton mène directement à la page ${(ctaPage[1] && strip(ctaPage[1])) || 'de contact'}`, `recherche.html?q=${encodeURIComponent(p.n)}`, '.kp .acts'),
          S('Photos professionnelles de l\'établissement et des prestations', 'Façade, intérieur, équipe et produits', `recherche.html?q=${encodeURIComponent(p.n)}`, '.kp .phs'),
          S('Une publication Google chaque semaine', 'Nouveautés, offres et événements', `recherche.html?q=${encodeURIComponent(p.n)}`, '.kp .gposts'),
          S(`Collecte d'avis clients et réponse à chacun sous 48 h`, `Objectif : ${String(pr.r).replace('.', ',')}/5 sur ${pr.v} avis`, `recherche.html?q=${encodeURIComponent(p.n)}`, '.kp .rvw'),
          S('Questions fréquentes renseignées à l\'avance', 'Moins d\'appels, plus de clients rassurés', `recherche.html?q=${encodeURIComponent(p.n)}`, '.kp .qa'),
        ],
      },
      facebook: {
        state: so.includes('facebook') ? 'Page existante mais incomplète et peu animée' : 'Aucune page Facebook',
        recos: [
          S(`${so.includes('facebook') ? 'Refonte' : 'Création'} de la page « ${(nets.facebook || {}).name || p.n} » : couverture et logo`, 'Une page cohérente avec le site et la fiche Google', `social.html?slug=${slug}&net=facebook`, '.fb .cover'),
          S(`Bouton « ${strip(fbBtn)} » et messagerie activée`, 'Les visiteurs passent à l\'action depuis Facebook', `social.html?slug=${slug}&net=facebook`, '.fb .id .bt'),
          S(`Rubrique Intro complète : « ${strip((nets.facebook || {}).bio || p.tagline)} », adresse, téléphone, site et horaires`, '', `social.html?slug=${slug}&net=facebook`, '#fbc .card'),
          S(`${posts.length} publications prêtes à l'emploi`, posts.slice(0, 2).map((x) => '« ' + x.cap.replace(/\s+/g, ' ').slice(0, 60).trim() + '… »').join(' · '), `social.html?slug=${slug}&net=facebook`, '#fbc .post'),
        ],
      },
      social: {
        state: so.includes('instagram') || so.includes('tiktok') ? 'Compte existant sans ligne éditoriale ni lien vers la réservation' : 'Aucun compte Instagram ni TikTok',
        recos: [
          S(`Compte Instagram @${(nets.instagram || {}).user || p.handle} : bio optimisée et lien vers ${p.domain}`, '', `social.html?slug=${slug}&net=instagram`, '.ig .bio'),
          S(`Stories à la une : ${(SD.highlights || []).join(', ')}`, 'Les informations clés accessibles en un geste', `social.html?slug=${slug}&net=instagram`, '.ig .hl'),
          S(`Grille de ${posts.length} publications cohérentes : photos, carrousels et Reels`, 'Une identité visuelle reconnaissable', `social.html?slug=${slug}&net=instagram`, '#gw'),
          S(`Compte TikTok @${(nets.tiktok || {}).user || p.handle} : ${vids} vidéos courtes`, posts[0] ? '« ' + posts[0].cap.replace(/\s+/g, ' ').slice(0, 60).trim() + '… »' : '', `social.html?slug=${slug}&net=tiktok`, '#tg'),
        ],
      },
    };
    const bonus = [
      S(`Page LinkedIn entreprise et ${(SD.jobs || []).length} offres d'emploi : ${(SD.jobs || []).join(', ')}`, 'Pour recruter et rassurer partenaires et clients professionnels', `social.html?slug=${slug}&net=linkedin`, '.li .hd|.li .card'),
    ];
    if (/pack complet/i.test(p.a)) bonus.unshift(S('Identité visuelle : logo et couleurs déclinés partout', 'Site, réseaux et fiche Google parlent d\'une seule voix', site + 'index.html', '.hd .logo|nav .brand|.brand|header'));
    return { R, bonus };
  }

  window.NEAMSCORE = { MAX, LABEL, before, after, plan, proj };
})();
