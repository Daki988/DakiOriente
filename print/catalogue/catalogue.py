# Catalogue NEAM 2026–2027 (A4, 20 pages) : génère print/catalogue/catalogue.html
# Sources : Company Blueprint 2027, présentation NEAM × KANIE 30/30, contenus du site.
import os, re, segno

ROOT = '/home/user/DakiOriente'
OUT = os.path.join(ROOT, 'print/catalogue')
A = '../../assets/'          # ressources du site
FONDATEUR_NOM = 'Daril OYE MBA'
FONDATEUR_TITRE = 'Fondateur · Consultant en transformation digitale'
SITE = 'https://www.neamindustry.com/'

def qr(url, dark='#0f0f10'):
    svg = segno.make(url, error='m').svg_inline(scale=4, border=0, dark=dark, light=None)
    return re.sub(r'<svg ', '<svg class="qr__svg" ', svg, count=1)

def typo(html):
    # espaces insécables avant la ponctuation haute, hors balises
    parts = re.split(r'(<[^>]+>)', html)
    for i, p in enumerate(parts):
        if not p.startswith('<'):
            p = re.sub(r' ([?!:;»])', r'&nbsp;\1', p)
            p = p.replace('« ', '«&nbsp;')
            parts[i] = p
    return ''.join(parts)

PAGES = []
def page(cls, label, body, folio=True):
    n = len(PAGES) + 1
    head = '' if not label else f'<div class="runhead"><span>NEAM Softwares Industry · Catalogue 2026 – 2027</span><span>{label}</span></div>'
    foot = f'<div class="folio"><span>{n:02d}</span><span>Build a better tomorrow !</span></div>' if folio else ''
    PAGES.append(f'<section class="page {cls}">{head}{body}{foot}</section>')

CHEVRON = '<svg class="chev" viewBox="0 0 100 70" aria-hidden="true"><path d="M50 0 100 70H74L50 34 26 70H0z"/></svg>'

# ---------- 01 Couverture ----------
page('page--ink cover', '', f'''
  <img class="cover__logo" src="{A}logo-dark.png" alt="NEAM Softwares Industry">
  <div class="cover__mid">
    <span class="label label--y">Catalogue 2026 – 2027 · Libreville, Gabon</span>
    <h1 class="cover__title">Le partenaire de votre <em>transformation digitale</em>.</h1>
    <p class="cover__sub">Digitaliser. Automatiser. Développer.</p>
  </div>
  {CHEVRON}
  <div class="cover__foot">
    <ul class="pillars"><li>Visibilité</li><li>Digitalisation</li><li>Automatisation</li><li>Data</li><li>Innovation</li></ul>
    <span class="label">neamindustry.com</span>
  </div>''', folio=False)

# ---------- 02 Sommaire ----------
TOC = [('03', 'Le mot du fondateur'), ('04', 'Le parcours du fondateur'), ('05', 'Notre histoire'), ('06', 'Le Gabon numérique'),
       ('07', 'Vision, mission, valeurs'), ('08', 'Notre positionnement'), ('09', 'Les 5 piliers de la maturité digitale'), ('10', 'Nos expertises'),
       ('12', 'Notre méthode'), ('13', 'Un exemple concret'), ('14', 'Nos offres'), ('15', 'NEAM Digital Score™'), ('16', 'Programme NEAM × KANIE 30/30'),
       ('17', 'Expérience et réalisations'), ('18', 'La campagne #EtÇaRapporteCombien'), ('19', 'Notre trajectoire 2027'), ('20', 'Nous contacter')]
toc = ''.join(f'<li><span class="toc__n">{n}</span><span class="toc__t">{t}</span></li>' for n, t in TOC)
page('', 'Sommaire', f'''
  <div class="split split--toc">
    <div>
      <h1>Sommaire</h1>
      <p class="lead">Ce catalogue présente NEAM Softwares Industry&nbsp;: d’où nous venons, ce en quoi nous croyons, ce que nous faisons pour les entreprises, et où nous allons.</p>
      <div class="keyfacts">
        <div><b>4</b><span>expertises complémentaires</span></div>
        <div><b>5</b><span>étapes, du diagnostic à la mesure</span></div>
        <div><b>150</b><span>critères dans notre diagnostic</span></div>
        <div><b>48&nbsp;h</b><span>ouvrées maximum pour vous répondre</span></div>
      </div>
    </div>
    <ol class="toc">{toc}</ol>
  </div>''')

# ---------- 03 Le mot du fondateur ----------
sign = f'<span class="founder__who"><b>{FONDATEUR_NOM}</b>{FONDATEUR_TITRE}<br>NEAM Softwares Industry</span>'
page('page--photo', '', f'''
  <div class="founder__photo"><img src="img/fondateur.jpg" alt="{FONDATEUR_NOM}, fondateur de NEAM Softwares Industry"></div>
  <div class="founder__body">
    <span class="label label--y2">Le mot du fondateur</span>
    <p class="founder__quote">« Être bon dans son métier ne suffit plus&nbsp;: encore faut-il qu’on vous <em>trouve</em>. »</p>
    <div class="cols2">
      <p>J’ai fondé NEAM Softwares Industry avec une conviction&nbsp;: la transformation digitale ne doit pas être réservée aux grandes entreprises. Une boulangerie d’Akanda, un cabinet de Libreville ou une PME du BTP peuvent, elles aussi, être visibles, gagner du temps, mieux connaître leurs clients et vendre davantage.</p>
      <p>Avant NEAM, j’ai conçu des ERP et des progiciels de gestion, piloté des stratégies de communication digitale et travaillé le référencement de sites, pour des entreprises au Gabon, au Maroc et à Monaco. J’y ai vu de près ce qu’un outil bien pensé change dans une entreprise.</p>
      <p>Au Gabon, la base est là&nbsp;: une population largement connectée, qui paie sur mobile. Ce qui manque encore, ce sont les outils et l’accompagnement pour en tirer parti. C’est précisément notre métier&nbsp;: diagnostiquer, construire, déployer, puis rester à vos côtés.</p>
      <p>Nous ne voulons pas être un prestataire de plus, qui livre un site puis disparaît. Nous voulons être le partenaire technologique qui vous aide à aller plus loin, avec une seule question en tête&nbsp;: qu’est-ce que cela vous rapporte&nbsp;?</p>
      <p>Notre ambition est claire&nbsp;: lorsqu’une TPE ou une PME gabonaise souhaite se digitaliser, NEAM doit naturellement faire partie des premiers partenaires auxquels elle pense. Ces pages vous montrent comment nous y travaillons.</p>
    </div>
    <p class="founder__sign">{sign}<span class="founder__motto">Build a better tomorrow !</span></p>
  </div>''')

# ---------- 04 Parcours du fondateur ----------
ROLES = [('Févr. – oct. 2024', 'Responsable commercial', 'Bureau International de Conseil et de Promotion · Gabon', 'Stratégie réseaux sociaux, veille concurrentielle, analyse de marché.'),
         ('Juil. – oct. 2023', 'Responsable marketing', 'Blueprotein · Maroc', 'Communication digitale ; conception et développement d’un ERP.'),
         ('Janv. – mars 2022', 'Community manager', 'TNP Consultants · Maroc', 'Stratégie médias sociaux, benchmark et veille ; ERP sur PowerApps, Power Automate et Power BI.'),
         ('Juin – nov. 2021', 'Community manager', 'Virtually · Monaco – France', 'Réseaux sociaux et campagnes publicitaires pour le luxe, référencement naturel (SEO).'),
         ('Juil. – déc. 2020', 'Community manager', 'Bouenguidi Sports · Gabon', 'Stratégie digitale et image du club pour sa première Ligue des champions africaine.')]
roles = ''.join(f'<li><span class="tl__d">{d}</span><div><b>{r}</b><i>{o}</i><span>{t}</span></div></li>' for d, r, o, t in ROLES)
SKILLS = ['Gestion de projet', 'Optimisation des processus', 'Stratégie digitale', 'ERP et PGI', 'Référencement (SEO)', 'Community management', 'Stratégie de contenu', 'Chartes graphiques', 'WordPress', 'Figma', 'Canva', 'PowerApps', 'Power Automate', 'Adobe Creative Suite']
page('page--grey', 'Le parcours du fondateur', f'''
  <div class="split split--bio">
    <div class="bio">
      <span class="label">Le parcours du fondateur</span>
      <h1>{FONDATEUR_NOM}</h1>
      <p class="bio__role">Consultant en transformation digitale<br>Fondateur de NEAM Softwares Industry</p>
      <p class="lead">Professionnel du marketing digital et de la gestion d’entreprise, {FONDATEUR_NOM} met ses compétences au service de l’optimisation des processus et de solutions innovantes&nbsp;: marketing digital, gestion de projets et création d’outils digitaux.</p>
      <div class="bio__figs"><div><b>2020</b><span>premières missions en communication digitale</span></div><div><b>3</b><span>ERP et progiciels de gestion conçus</span></div><div><b>7</b><span>certifications Google, Facebook Blueprint et HubSpot</span></div></div>
      <div class="bio__block"><span class="label">Certifications</span>
        <ul class="bio__chips bio__chips--line"><li>4 certifications Google</li><li>2 certifications Facebook Blueprint</li><li>Inbound Marketing · HubSpot Academy</li><li>Marketing digital et réseaux sociaux</li><li>PowerApps, Power Automate et Power BI</li><li>Photoshop, After Effects et Illustrator</li></ul></div>
      <div class="bio__block bio__engage"><span class="label">Engagements</span>
        <p>Coordinateur du département NTIC lors des Assises de la Diaspora gabonaise au Maroc (2023). Ancien délégué général à la communication du Bureau exécutif de l’Union des Gabonais au Maroc.</p></div>
    </div>
    <div class="bio__side">
      <span class="label">Expériences professionnelles</span>
      <ul class="tl">{roles}</ul>
      <div class="bio__block"><span class="label">Compétences</span><ul class="bio__chips bio__chips--line">{''.join(f'<li>{x}</li>' for x in SKILLS)}</ul></div>
      <div class="bio__block bio__where"><span class="label">Terrains d’expérience</span><p>Gabon · Maroc · Monaco · France · Burkina Faso</p><span>Des missions pour des entreprises, un club de football, une organisation de réflexion et des marques du luxe.</span></div>
    </div>
  </div>''')

# ---------- 05 Notre histoire ----------
BUILT = [('NEAM Digital Score™', 'Diagnostic sur 150 critères et test de maturité', 'Disponible', 'live'), ('neamindustry.com', 'Site, blog et assistant en ligne', 'Disponible', 'live'),
         ('Livre blanc', 'La maturité numérique du Gabon', 'Publié', 'live'), ('Company Blueprint 2027', 'Notre feuille de route, en accès libre', 'Publié', 'live'),
         ('NEAM × KANIE 30/30', 'Programme d’accompagnement de 30 TPE et PME', 'Candidatures en ligne', 'live'),
         ('#EtÇaRapporteCombien', 'Campagne d’affiches et manifeste vidéo', 'Publiée', 'live')]
built = ''.join(f'<li><div><b>{n}</b><span>{d}</span></div><i class="st st--{k}">{s}</i></li>' for n, d, s, k in BUILT)
page('page--grey', 'Notre histoire', f'''
  <span class="label">Notre histoire</span>
  <h1>Une conviction née à <em>Libreville</em>.</h1>
  <div class="split split--story">
    <div class="story">
      <p class="lead">NEAM Softwares Industry part d’un constat&nbsp;: beaucoup d’entreprises gabonaises excellent dans leur métier, mais restent invisibles en ligne et gèrent encore leur activité sur papier, sur Excel ou dans des messages éparpillés.</p>
      <p>Plutôt que de livrer des sites puis de passer au projet suivant, nous avons choisi un autre modèle&nbsp;: celui d’un partenaire technologique, qui diagnostique, construit, déploie et accompagne dans la durée.</p>
      <p>NEAM s’appuie sur le parcours de son fondateur, {FONDATEUR_NOM}&nbsp;: des ERP et progiciels de gestion conçus pour des entreprises, des stratégies digitales et du référencement, au Gabon, au Maroc et à Monaco.</p>
      <p>Depuis Libreville, nous avons conçu notre propre méthode de diagnostic, le NEAM Digital Score™, et un programme d’accompagnement avec KANIE Agency. Notre feuille de route, le Company Blueprint 2027, est publique&nbsp;: nous voulons que nos clients sachent exactement où nous allons.</p>
      <blockquote>«&nbsp;Vous connaissez votre métier. NEAM construit la technologie qui vous aide à aller plus loin.&nbsp;»<cite>Notre promesse</cite></blockquote>
    </div>
    <div>
      <span class="label">Ce que nous avons déjà construit</span>
      <ul class="built">{built}</ul>
    </div>
  </div>''')

# ---------- 05 Le Gabon numérique ----------
FIGS = [('71,9&nbsp;%', 'de la population en ligne, soit 1,87 million d’internautes', 'DataReportal (Kepios), fin 2025'),
        ('2,39&nbsp;M', 'abonnements Internet, dont 94&nbsp;% mobiles', 'ARCEP, T4 2025'),
        ('≈&nbsp;70&nbsp;%', 'des adultes ont un compte mobile money (40&nbsp;% en Afrique subsaharienne)', 'Global Findex 2025'),
        ('4&nbsp;018', 'entreprises créées au premier trimestre 2025, dont 93&nbsp;% en ligne', 'ANPI, T1 2025'),
        ('0&nbsp;/&nbsp;20', 'en mesures techniques de cybersécurité (20&nbsp;/&nbsp;20 sur le volet juridique)', 'UIT, Global Cybersecurity Index 2024')]
figs = ''.join(f'<div class="fig"><b>{v}</b><span>{t}</span><i>{s}</i></div>' for v, t, s in FIGS)
page('page--ink', 'Le Gabon numérique', f'''
  <span class="label">Pourquoi maintenant</span>
  <h1>Le Gabon est <em>connecté</em>. Ses entreprises doivent suivre.</h1>
  <div class="figs">{figs}
    <div class="fig fig--read"><span class="label label--y">Lecture NEAM</span><p>La base est connectée et paie sur mobile&nbsp;; l’outillage interne des entreprises reste à construire, sur des canaux qu’elles maîtrisent.</p></div>
  </div>
  <p class="source">Sources détaillées&nbsp;: livre blanc NEAM, «&nbsp;La maturité numérique du Gabon&nbsp;», à télécharger sur neamindustry.com/ressources.html</p>''')

# ---------- 06 Vision, mission, valeurs ----------
page('', 'Vision, mission, valeurs', f'''
  <span class="label">Ce qui nous guide</span>
  <h1>Construire des entreprises plus <em>performantes</em> grâce au numérique.</h1>
  <div class="vmv">
    <div><span class="k">Vision</span><p>Construire des entreprises plus performantes grâce au numérique, et faire de la technologie un levier de croissance pour les entreprises africaines.</p></div>
    <div><span class="k">Mission</span><p>Transformer les besoins métiers en solutions digitales concrètes, simples et mesurables, en accompagnant les TPE et PME dans leur transformation digitale.</p></div>
    <div><span class="k">Ambition 2027</span><p>Devenir la référence gabonaise de la transformation digitale des TPE et PME, puis étendre notre action à la région.</p></div>
  </div>
  <div class="values">
    <span class="label">Nos valeurs</span>
    <ul><li><b>Innovation</b><span>Chercher la solution la plus utile, pas la plus à la mode.</span></li><li><b>Proximité</b><span>Parler votre langage, comprendre vos réalités.</span></li><li><b>Impact</b><span>Viser un résultat concret pour votre activité.</span></li><li><b>Fiabilité</b><span>Tenir nos engagements et nos délais.</span></li><li><b>Orientation résultat</b><span>Mesurer ce que le digital vous rapporte.</span></li></ul>
  </div>
  <div class="manifesto">
    <p>Nous pensons que la transformation digitale ne doit pas être réservée aux grandes entreprises. Une petite entreprise peut, elle aussi, <em>être visible, automatiser, exploiter ses données, mieux connaître ses clients, vendre davantage, gagner du temps</em> et grandir.</p>
    <span class="label">Extrait de notre manifeste</span>
  </div>''')

# ---------- 07 Positionnement ----------
ADV = [('Proximité', 'Comprendre les réalités opérationnelles et financières des entreprises gabonaises.'), ('Accessibilité', 'Des solutions adaptées au niveau de maturité et aux moyens de chaque client.'),
       ('Intégration', 'Une seule structure pour intervenir sur plusieurs dimensions&nbsp;: web, logiciels, IA, conseil.'), ('Technologie', 'Des briques et des produits propriétaires, réutilisables.'),
       ('Accompagnement', 'Une relation continue plutôt qu’une simple livraison.')]
adv = ''.join(f'<li><b>{t}</b><span>{d}</span></li>' for t, d in ADV)
page('page--grey', 'Notre positionnement', f'''
  <span class="label">Notre positionnement</span>
  <h1>Pas une agence web de plus. Un <em>partenaire technologique</em>.</h1>
  <div class="models">
    <div class="model"><span class="label">Modèle classique</span><ol class="flowline"><li>Commande</li><li>Prestation</li><li>Livraison</li><li class="end">Fin</li></ol><p>Une relation transactionnelle, qui s’arrête à la livraison.</p></div>
    <div class="model model--neam"><span class="label label--y2">Modèle NEAM</span><ol class="flowline flowline--loop"><li>Diagnostic</li><li>Feuille de route</li><li>Déploiement</li><li>Accompagnement</li></ol><p>Une amélioration continue&nbsp;: la relation ne s’arrête pas.</p></div>
  </div>
  <div class="split split--adv">
    <div><span class="label">Ce qui nous distingue</span><ul class="adv">{adv}</ul></div>
    <div class="refuse"><span class="label">Ce que nous refusons d’être</span><ul><li>Une simple agence de communication</li><li>Un vendeur de sites à bas prix</li><li>Une équipe de freelances isolés</li><li>Une entreprise qui accepte tous les projets, sans stratégie</li></ul>
      <p class="refuse__promise"><b>Relation</b> ponctuelle → <b>durable</b><br><b>Rôle</b> prestataire → <b>partenaire</b><br><b>Objectif</b> un livrable → <b>un résultat mesuré</b></p></div>
  </div>''')

# ---------- 08 Les 5 piliers ----------
PIL = [('Visibilité', 'Être trouvé et reconnu', 'Sites web, fiche Google, référencement (SEO), réseaux sociaux, identité numérique.'),
       ('Digitalisation', 'Structurer les opérations', 'CRM, gestion commerciale, stocks, RH, facturation, documents, projets.'),
       ('Automatisation', 'Réduire les tâches', 'Workflows, notifications, relances, intégrations, IA et automatisations.'),
       ('Data', 'Piloter par les indicateurs', 'Tableaux de bord, indicateurs clés, reporting, analyse commerciale et aide à la décision.'),
       ('Innovation', 'Créer de nouveaux modèles', 'SaaS, plateformes, applications, IA, places de marché et solutions sectorielles.')]
stairs = ''.join(f'<div class="stair" style="--h:{28 + i * 15}%"><span class="stair__n">{i + 1}</span><b>{t}</b><i>{s}</i></div>' for i, (t, s, d) in enumerate(PIL))
pil = ''.join(f'<li><span class="k">0{i + 1}</span><div><b>{t}</b><span>{d}</span></div></li>' for i, (t, s, d) in enumerate(PIL))
page('', 'Les 5 piliers', f'''
  <span class="label">Notre proposition de valeur</span>
  <h1>Toute la chaîne de la <em>maturité digitale</em>.</h1>
  <p class="lead">Chaque entreprise part d’un point différent. Nous l’accompagnons marche après marche&nbsp;: plus elle gagne en maturité, plus le digital crée de valeur.</p>
  <div class="stairs">{stairs}</div>
  <ul class="pillist">{pil}</ul>''')

# ---------- 09-10 Expertises ----------
SVC = [('01', 'Digital &amp; Web', 'Sites · E-commerce · UX/UI', 'Votre site est souvent le premier contact avec un client. Nous le rendons clair, rapide et agréable sur mobile, et nous faisons en sorte qu’il soit trouvé sur Google. Résultat&nbsp;: plus de visites, et surtout plus de demandes.',
        ['Sites vitrines', 'Plateformes web', 'E-commerce', 'Paiement Airtel Money / Moov Money', 'Design UX/UI', 'Référencement (SEO)', 'Réseaux sociaux'], [('Site vitrine', '2 à 4 semaines'), ('Boutique en ligne ou plateforme', '6 à 12 semaines'), ('Référencement', 'premiers effets en 3 à 6 mois')]),
       ('02', 'Logiciels &amp; Outils', 'CRM · ERP · Tableaux de bord', 'Encore des cahiers, des fichiers Excel et des messages WhatsApp pour suivre vos clients&nbsp;? Nous créons des outils simples, pensés pour votre activité, qui rassemblent tout au même endroit et vous font gagner un temps précieux.',
        ['Applications métier', 'CRM', 'ERP', 'Tableaux de bord', 'Outils internes'], [('Cadrage', '1 à 2 semaines'), ('Première version utilisable', '6 à 12 semaines'), ('Évolutions', 'en continu')]),
       ('03', 'IA &amp; Automatisation', 'Assistants IA · Workflows', 'Devis, relances, réponses aux questions fréquentes… Une partie de ces tâches peut être confiée à des assistants intelligents. Vous gagnez des heures chaque semaine, et vos équipes se concentrent sur ce qui compte vraiment.',
        ['Assistants IA', 'Workflows', 'Automatisation', 'Optimisation des opérations'], [('Premier workflow automatisé', '1 à 3 semaines'), ('Assistant IA de réponse', '2 à 6 semaines'), ('Extensions', 'au fil de l’eau')]),
       ('04', 'Conseil &amp; Formation', 'Diagnostic · Stratégie · Formation', 'Vous ne savez pas par où commencer&nbsp;? C’est normal. Nous faisons le point avec vous, nous fixons les bonnes priorités et nous formons vos équipes pour que les nouveaux outils soient vraiment utilisés.',
        ['Diagnostic digital', 'Stratégie digitale', 'Accompagnement des équipes', 'Formation'], [('Diagnostic et feuille de route', '1 à 2 semaines'), ('Formation', 'd’une demi-journée à deux jours'), ('Accompagnement', 'mensuel, selon vos besoins')])]
def svc(n, name, tag, desc, items, delays):
    return f'''<article class="svc">
      <div class="svc__head"><span class="svc__n">{n}</span><div><h2>{name}</h2><span class="label">{tag}</span></div></div>
      <p class="svc__desc">{desc}</p>
      <ul class="chips">{''.join(f'<li>{x}</li>' for x in items)}</ul>
      <div class="delays"><span class="label">Délais indicatifs</span>{''.join(f'<div><b>{a}</b><span>{b}</span></div>' for a, b in delays)}</div>
    </article>'''
page('', 'Nos expertises', f'''
  <span class="label">Nos expertises · 1 / 2</span>
  <h1>Quatre expertises, <em>un seul</em> partenaire.</h1>
  {svc(*SVC[0])}{svc(*SVC[1])}''')
page('', 'Nos expertises', f'''
  <span class="label">Nos expertises · 2 / 2</span>
  {svc(*SVC[2])}{svc(*SVC[3])}
  <div class="sectors"><span class="label">Secteurs accompagnés</span><p>Commerce · Restauration · Immobilier · Services · Éducation · BTP · Cabinets · PME, à Libreville, Akanda, Owendo et partout au Gabon.</p></div>''')

# ---------- 11 Méthode ----------
METHOD = [('Audit', 'Nous commençons par regarder où vous en êtes&nbsp;: votre présence en ligne, vos outils, vos habitudes de travail. Le NEAM Digital Score™ chiffre ce point de départ.'),
          ('Stratégie', 'Ensemble, nous fixons les priorités, les objectifs et une feuille de route réaliste, adaptée à vos moyens.'),
          ('Production', 'Nous créons les supports, les contenus et les outils dont vous avez besoin.'),
          ('Déploiement', 'Nous mettons en ligne, nous automatisons et nous formons vos équipes, pour que les outils soient vraiment adoptés.'),
          ('Mesure', 'Nous suivons les résultats et ajustons ce qui doit l’être. Le digital s’améliore en continu.')]
meth = ''.join(f'<li><span class="m__n">0{i + 1}</span><div><h3>{t}</h3><p>{d}</p></div></li>' for i, (t, d) in enumerate(METHOD))
page('page--ink', 'Notre méthode', f'''
  <span class="label">Notre méthode</span>
  <h1>Une méthode claire, <em>en 5 étapes</em>.</h1>
  <ol class="method">{meth}</ol>
  <div class="promise"><b>Notre engagement</b><p>Une réponse sous 48&nbsp;heures ouvrées maximum à chaque demande, et un devis détaillé, gratuit et sans engagement avant tout projet.</p></div>''')

# ---------- 13 Un exemple concret ----------
STEPS = [('01', 'Être visible', 'Un site clair et une fiche Google à jour&nbsp;: quand on cherche une pâtisserie à Libreville, Denise apparaît enfin.'),
         ('02', 'Être choisie', 'Une image professionnelle, des photos qui donnent envie et un contact facile&nbsp;: le visiteur devient client.'),
         ('03', 'Grandir', 'Des outils simples pour les commandes et, surtout, du temps retrouvé pour ce qu’elle fait de mieux.')]
steps = ''.join(f'<li><span class="m__n">{n}</span><div><h3>{t}</h3><p>{d}</p></div></li>' for n, t, d in STEPS)
page('', 'Un exemple concret', f'''
  <span class="label">Un exemple concret · histoire illustrative</span>
  <h1>L’histoire de <em>Denise</em>, pâtissière à Libreville.</h1>
  <div class="denise__img"><img src="{A}video/neam-histoire-denise-poster.jpg" alt="Voici Denise, pâtissière à Libreville"></div>
  <div class="split split--denise">
    <div class="story">
      <p class="lead">Les meilleurs gâteaux du quartier. Ses clients l’adorent, en parlent autour d’eux et reviennent. Mais un soir, quelqu’un la cherche sur son téléphone… et ne la trouve pas.</p>
      <p>Être excellente dans son métier ne suffit plus. Avec NEAM, Denise avance pas à pas, en trois étapes. Aujourd’hui, elle est trouvée, et elle est choisie.</p>
      <div class="qr"><div class="qr__img">{qr(SITE + 'index.html#croissance')}</div><div><b>Voir l’histoire en vidéo</b><span>1 min 54 · neamindustry.com</span></div></div>
    </div>
    <ol class="dsteps">{steps}</ol>
  </div>
  <p class="source">Histoire illustrative&nbsp;: Denise est un personnage, pas une cliente réelle. Elle résume ce que nous construisons avec chaque entreprise.</p>''')

# ---------- 14 Offres ----------
OFF = [('Starter', 'Micro-entreprises', 'Présence digitale, fiche Google, page de présentation, diagnostic.', 1),
       ('Business', 'TPE', 'Site web, identité numérique, référencement, outils commerciaux, accompagnement.', 2),
       ('Growth', 'PME', 'CRM, automatisations, données, acquisition de clients, accompagnement avancé.', 3),
       ('Enterprise', 'Organisations complexes', 'Solutions métiers, intégrations, développement spécifique.', 4),
       ('Custom', 'Besoins spécifiques', 'Architecture et solution conçues entièrement sur mesure.', 5)]
off = ''.join(f'<li><div class="off__name"><span>NEAM</span><b>{n}</b><i>{c}</i></div><p>{d}</p><div class="off__bar" style="--v:{v}"><span></span></div></li>' for n, c, d, v in OFF)
page('page--grey', 'Nos offres', f'''
  <span class="label">Nos offres</span>
  <h1>Une offre pour chaque <em>niveau de maturité</em>.</h1>
  <p class="lead">De la micro-entreprise qui veut être trouvée sur Google à l’organisation qui a besoin d’un logiciel sur mesure&nbsp;: nous servons chaque étape, sans diluer la qualité.</p>
  <ul class="offers">{off}</ul>
  <p class="note">La barre indique la profondeur de l’accompagnement. Chaque projet fait l’objet d’un devis détaillé, gratuit et sans engagement.</p>''')

# ---------- 13 Digital Score ----------
page('page--yellow', 'NEAM Digital Score™', f'''
  <span class="label label--ink">Outil propriétaire · gratuit en ligne</span>
  <h1>NEAM Digital Score™&nbsp;: mesurez votre <em>maturité digitale</em>.</h1>
  <div class="split split--ds">
    <div>
      <p class="lead">Avant de vous conseiller, nous mesurons. Le Digital Score évalue votre entreprise et vous dit, en quelques minutes, où vous en êtes et par quoi commencer.</p>
      <ul class="dslist">
        <li><b>150 critères</b><span>Site web, fiche Google, réseaux sociaux, avis, vitesse, sécurité, référencement.</span></li>
        <li><b>8 questions</b><span>Un test rapide de maturité numérique&nbsp;: gestion, relation client, paiements, sauvegardes, compétences.</span></li>
        <li><b>65&nbsp;% + 35&nbsp;%</b><span>Le score global combine la présence en ligne (65&nbsp;%) et la maturité interne (35&nbsp;%).</span></li>
        <li><b>Benchmark</b><span>Votre position face à vos concurrents locaux.</span></li>
        <li><b>Plan d’action</b><span>Des actions priorisées, avec leur impact estimé, et un rapport PDF complet.</span></li>
      </ul>
    </div>
    <div class="ds__side">
      <div class="gauge">
        <span class="label label--ink">Exemple illustratif d’une PME type</span>
        <div class="gauge__row"><div><b>32</b><i>/100</i><span>Diagnostic initial</span></div><div class="gauge__arrow">→</div><div><b>67</b><i>/100</i><span>Cible à 12 mois</span></div></div>
        <div class="gauge__bar"><span style="width:32%"></span><span class="gauge__gain" style="left:32%;width:35%">+35 pts</span></div>
      </div>
      <ol class="dssteps"><li><b>1</b><span>Indiquez votre entreprise&nbsp;: nom, ville, secteur et site web s’il existe.</span></li><li><b>2</b><span>Répondez aux 8 questions de maturité, en une minute.</span></li><li><b>3</b><span>Obtenez votre score tout de suite, puis le rapport complet et le plan d’action par e-mail.</span></li></ol>
      <div class="qr qr--ink"><div class="qr__img">{qr(SITE + 'digital-score.html')}</div><div><b>Faites le test</b><span>neamindustry.com/digital-score.html</span></div></div>
    </div>
  </div>''')

# ---------- 16 Programme 30/30 ----------
WEEKS = [('Semaine 1', 'Audit &amp; stratégie', ['Réunion de lancement', 'Diagnostic digital', 'Benchmark concurrentiel', 'Plan d’action']),
         ('Semaine 2', 'Web &amp; identité', ['Architecture ou refonte du site', 'Identité visuelle', 'Optimisation mobile', 'Fondations SEO']),
         ('Semaine 3', 'Communication &amp; contenu', ['Stratégie éditoriale', '8 contenus et visuels', 'Optimisation des réseaux', 'Parcours d’acquisition']),
         ('Semaine 4', 'Déploiement &amp; formation', ['Publication et mise en ligne', 'Formation et remise d’outils', 'Suivi des performances', 'Feuille de route 90 jours'])]
weeks = ''.join(f'<div class="week"><span class="label">{w}</span><h3>{t}</h3><ul>{"".join(f"<li>{x}</li>" for x in it)}</ul></div>' for w, t, it in WEEKS)
page('page--grey', 'Programme 30/30', f'''
  <span class="label">Programme d’accélération</span>
  <h1>NEAM × KANIE 30/30&nbsp;: 30 entreprises, 30 jours, <em>1 transformation</em>.</h1>
  <div class="alliance"><div><b>NEAM</b><span>Technologie · Web · IA · Automatisation</span></div><div class="plus">+</div><div><b>KANIE Agency</b><span>Stratégie · Créativité · Communication</span></div><div class="plus">=</div><div><b>Ensemble</b><span>Diagnostic → production → accompagnement</span></div></div>
  <div class="weeks">{weeks}</div>
  <div class="gains"><span class="label">Ce que l’entreprise doit gagner</span><ul><li>Plus de visibilité</li><li>Une image plus professionnelle</li><li>Une communication plus structurée</li><li>Des outils mieux exploités</li><li>Un plan clair pour les 90 prochains jours</li></ul></div>
  <div class="split split--30">
    <div><span class="label">À la fin du cycle, l’entreprise repart avec</span><ul class="ticks2"><li>Un diagnostic digital et de maturité numérique</li><li>Un benchmark de 5 concurrents</li><li>Un site créé ou optimisé</li><li>8 contenus prêts à publier</li><li>Des recommandations IA et outils numériques</li><li>Un plan d’action à 90 jours</li></ul></div>
    <div class="qr"><div class="qr__img">{qr(SITE + 'candidature.html')}</div><div><b>Candidater en 3 minutes</b><span>neamindustry.com/candidature.html</span></div></div>
  </div>''')

# ---------- 17 Expérience et réalisations ----------
NEAMR = [(f'<img src="{A}icons/icon-512.png" alt="">', 'case__ds', 'NEAM Digital Score™', 'Outil de diagnostic', 'Un moteur d’audit de 150 critères, un test de maturité, un benchmark concurrentiel, un plan d’action priorisé et un rapport PDF.', 'Disponible'),
         (f'<img src="{A}products/neamindustry-ui.jpg" alt="">', '', 'neamindustry.com', 'Site institutionnel', 'Conception éditoriale, design, développement, formulaires connectés, référencement local, blog et assistant en ligne.', 'Disponible'),
         (f'<img src="{A}docs/livre-blanc/p01.jpg" alt=""><img src="{A}docs/blueprint/p01.jpg" alt="">', 'case__docs', 'Livre blanc et Blueprint 2027', 'Études et stratégie', 'La maturité numérique du Gabon, chiffres sourcés à l’appui, et notre feuille de route publique.', 'Publiés')]
nr = ''.join(f'<article class="case"><div class="case__img {c}">{v}</div><div class="case__body"><div class="case__top"><i class="st st--live">{st}</i><span class="label">{k}</span></div><h3>{n}</h3><p>{d}</p></div></article>' for v, c, n, k, d, st in NEAMR)
PROJ = [('2024 – 2025', 'FINAM', 'Gabon', 'Progiciel de gestion intégré (PGI)&nbsp;: analyse des besoins, conception, développement et intégration des modules clés.', 'Logiciels'),
        ('2024', 'Bureau International de Conseil et de Promotion', 'Gabon', 'Stratégie sur les réseaux sociaux, veille concurrentielle et analyse de marché, pour plus de visibilité et d’engagement.', 'Digital &amp; Conseil'),
        ('2023', 'Blueprotein', 'Maroc', 'Conception et développement d’un ERP pour optimiser les processus internes&nbsp;; stratégie réseaux sociaux.', 'Logiciels'),
        ('2022', 'TNP Consultants', 'Maroc', 'ERP sur Microsoft PowerApps, Power Automate et Power BI pour améliorer la gestion des données.', 'Automatisation'),
        ('2021', 'Centre de Réflexion pour le Sahel', 'Burkina Faso', 'Site WordPress avec blog et podcast, charte graphique et communication digitale.', 'Web'),
        ('2021', 'Virtually, CATS, Komo Concept Store', 'Monaco', 'Réseaux sociaux pour le luxe, campagnes publicitaires et visuels, rédaction d’articles et référencement naturel.', 'Digital'),
        ('2020', 'Bouenguidi Sports', 'Gabon', 'Stratégie de communication digitale et réseaux sociaux du club pour sa première participation à une Ligue des champions africaine.', 'Digital')]
proj = ''.join(f'<li><span class="pj__d">{d}</span><div><b>{c}</b><i>{pays}</i><span>{t}</span></div><em class="pj__tag">{tag}</em></li>' for d, c, pays, t, tag in PROJ)
page('', 'Expérience et réalisations', f'''
  <span class="label">Expérience et réalisations</span>
  <h1>Ce que nous avons <em>déjà construit</em>.</h1>
  <div class="cases cases--3">{nr}</div>
  <div class="proj">
    <div class="proj__head"><span class="label">Projets menés par notre fondateur</span><p>Salarié ou indépendant, {FONDATEUR_NOM} a conduit ces projets au fil de son parcours&nbsp;: l’expérience sur laquelle NEAM s’appuie.</p></div>
    <ul class="pj">{proj}</ul>
  </div>''')

# ---------- 18 Campagne ----------
POST = ['01-et-ca-rapporte-combien', '02-plaquette-tres-chere', '03-les-likes-ne-paient-pas-le-loyer', '04-ia-5-minutes', '05-site-beau-caisse-vide', '06-parlez-lui-de-chiffre-affaires']
posters = ''.join(f'<img src="{A}affiches/{p}.jpg" alt="">' for p in POST)
page('page--ink', 'Notre campagne', f'''
  <div class="split split--camp">
    <div>
      <span class="label">Campagne #EtÇaRapporteCombien</span>
      <h1>Et ça rapporte <em>combien</em>&nbsp;?</h1>
      <p class="lead">La question que certaines agences n’aiment pas entendre. Notre campagne la pose franchement, parce qu’un projet digital se juge à ce qu’il rapporte, pas seulement à ce qu’il montre.</p>
      <ul class="camp"><li>Un beau site qui ne vend rien, c’est une plaquette très chère.</li><li>Les likes ne paient pas le loyer.</li><li>Votre site est beau. Votre caisse est vide.</li><li>Votre agence vous parle de couleurs&nbsp;? Parlez-lui de chiffre d’affaires.</li></ul>
      <div class="camp__qrs">
        <div class="qr qr--dark"><div class="qr__img">{qr(SITE + 'index.html#film', '#ffffff')}</div><div><b>Notre manifeste en vidéo</b><span>58 secondes</span></div></div>
        <div class="qr qr--dark"><div class="qr__img">{qr('https://www.instagram.com/neam.industry/', '#ffffff')}</div><div><b>@neam.industry</b><span>sur Instagram</span></div></div>
      </div>
    </div>
    <div class="posters">{posters}</div>
  </div>''')

# ---------- 19 Trajectoire ----------
ROAD = [('T1', 'Structurer', ['Identité et site', 'Offres et contrats', 'CRM et processus', 'NEAM Digital Score™', 'Portfolio']),
        ('T2', 'Acquérir', ['Programme 100 PME', 'Prospection terrain', 'Contenus', 'Partenariats', 'Récurrence']),
        ('T3', 'Industrialiser', ['SaaS', 'Automatisations', 'Composants réutilisables', 'Abonnements', 'Solutions sectorielles']),
        ('T4', 'Consolider', ['Optimisation', 'Recrutement', 'Nouveaux produits', 'Partenariats', 'Stratégie 2028'])]
road = ''.join(f'<div class="q"><span class="q__n">{q} 2027</span><h3>{t}</h3><ul>{"".join(f"<li>{x}</li>" for x in it)}</ul></div>' for q, t, it in ROAD)
CAP = ['Une marque forte', 'Une méthode propriétaire', 'Des clients accompagnés dans la durée', 'Des produits technologiques', 'Une expertise sectorielle', 'Des actifs numériques']
page('', 'Notre trajectoire', f'''
  <span class="label">Notre trajectoire · objectifs 2027</span>
  <h1>Structurer, acquérir, industrialiser, <em>consolider</em>.</h1>
  <div class="road">{road}</div>
  <div class="split split--cap">
    <div class="pme"><span class="label">Programme NEAM 100 PME · objectif</span><b>100</b><span class="pme__t">TPE et PME diagnostiquées, accompagnées et documentées en 2027</span>
      <div class="pme__steps"><div style="--w:30%"><i>T2</i><span>+30</span></div><div style="--w:65%"><i>T3</i><span>+35</span></div><div style="--w:100%"><i>T4</i><span>+35</span></div></div>
      <p>Chaque cas devient une preuve&nbsp;: situation initiale documentée, solutions déployées, résultats mesurés.</p></div>
    <div><span class="label">Cap 2027</span><ul class="cap">{''.join(f'<li>{c}</li>' for c in CAP)}</ul>
      <p class="horizon"><b>Et après&nbsp;?</b> Devenir la référence gabonaise émergente de la transformation digitale, puis étendre notre action à la région.</p></div>
  </div>
  <p class="source">Objectifs issus du Company Blueprint 2027, notre feuille de route publique.</p>''')

# ---------- 20 Contact ----------
page('page--ink back', '', f'''
  <img class="cover__logo" src="{A}logo-dark.png" alt="NEAM Softwares Industry">
  <div class="back__mid">
    <span class="label label--y">Et maintenant&nbsp;?</span>
    <h1 class="back__title">Et si la prochaine histoire, c’était <em>la vôtre</em>&nbsp;?</h1>
    <p class="lead">Commencez par le diagnostic gratuit, ou parlez-nous directement de votre projet&nbsp;: nous vous répondons sous 48&nbsp;heures ouvrées maximum.</p>
  </div>
  <div class="back__grid">
    <dl class="contact">
      <div><dt>WhatsApp</dt><dd>077 45 31 67</dd></div>
      <div><dt>Téléphone</dt><dd>060 22 94 47 · lundi – samedi, 8 h 30 – 17 h 30</dd></div>
      <div><dt>E-mail</dt><dd>contact@neamindustry.com</dd></div>
      <div><dt>Site web</dt><dd>www.neamindustry.com</dd></div>
      <div><dt>Instagram</dt><dd>@neam.industry</dd></div>
      <div><dt>Adresse</dt><dd>Libreville, Gabon · Akanda, Owendo et tout le Gabon</dd></div>
    </dl>
    <div class="back__qrs">
      <div class="qr qr--dark"><div class="qr__img">{qr(SITE + 'digital-score.html', '#ffffff')}</div><div><b>Diagnostic gratuit</b><span>Digital Score</span></div></div>
      <div class="qr qr--dark"><div class="qr__img">{qr('https://wa.me/24177453167?text=Bonjour%20NEAM%2C%20je%20souhaite%20un%20diagnostic%20digital.', '#ffffff')}</div><div><b>WhatsApp</b><span>077 45 31 67</span></div></div>
      <div class="qr qr--dark"><div class="qr__img">{qr(SITE, '#ffffff')}</div><div><b>Site web</b><span>neamindustry.com</span></div></div>
    </div>
  </div>
  {CHEVRON}
  <p class="back__motto">Build a better <em>tomorrow</em>&nbsp;!</p>''', folio=False)

html = f'''<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>NEAM Softwares Industry — Catalogue 2026–2027</title>
<link rel="stylesheet" href="fonts/fonts.css">
<link rel="stylesheet" href="catalogue.css">
</head>
<body>
{typo(chr(10).join(PAGES))}
</body>
</html>
'''
open(os.path.join(OUT, 'catalogue.html'), 'w').write(html)
print('pages', len(PAGES))
