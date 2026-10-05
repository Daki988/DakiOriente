<?php
declare(strict_types=1);

/**
 * Catalogue de certifications reconnues, relié aux compétences et aux langues du référentiel.
 * Colonnes : nom, organisme, domaine, compétences (noms du référentiel, séparés par des virgules),
 * langue, niveau, format, durée de préparation indicative, coût (gratuit | payant | mixte), lien, description, intérêt.
 * Les tarifs et modalités évoluent : la plateforme invite toujours à les vérifier auprès de l'organisme.
 */
return [
    // ---------- Langues ----------
    ['TOEIC Listening & Reading', 'ETS', 'Langues', '', 'Anglais', 'intermediaire', 'Examen en centre agréé', '1 à 3 mois', 'payant', 'https://www.ets.org/toeic.html',
        'Le test d\'anglais professionnel le plus utilisé par les entreprises : un score sur 990 qui situe ton niveau de façon objective.', 'Souvent demandé dans le pétrole, les mines et les multinationales.'],
    ['IELTS', 'British Council / IDP', 'Langues', '', 'Anglais', 'intermediaire', 'Examen en centre agréé', '1 à 3 mois', 'payant', 'https://www.ielts.org',
        'Évalue les 4 compétences (écouter, lire, écrire, parler) avec une note de 0 à 9.', 'La référence pour un projet d\'études ou de travail à l\'international.'],
    ['Cambridge B2 First', 'Cambridge English', 'Langues', '', 'Anglais', 'intermediaire', 'Examen en centre agréé', '3 à 6 mois', 'payant', 'https://www.cambridgeenglish.org',
        'Diplôme valable à vie qui atteste d\'un niveau B2 en anglais.', 'Un niveau B2 est souvent exigé pour les postes en contact avec des partenaires étrangers.'],
    ['DELE (espagnol)', 'Instituto Cervantes', 'Langues', '', 'Espagnol', 'intermediaire', 'Examen en centre agréé', '3 à 6 mois', 'payant', 'https://examenes.cervantes.es',
        'Diplôme officiel d\'espagnol, du niveau A1 au C2, valable à vie.', 'Utile pour les échanges avec la Guinée équatoriale et l\'Amérique latine.'],
    ['HSK (chinois)', 'Chinese Testing International', 'Langues', '', 'Chinois', 'debutant', 'Examen en centre agréé', '3 à 6 mois', 'payant', 'https://www.chinesetest.cn',
        'Test officiel de chinois mandarin, en 6 niveaux.', 'Un vrai différenciateur dans les entreprises du BTP, des mines et du commerce liées à la Chine.'],

    // ---------- Bureautique & numérique ----------
    ['PIX', 'Pix', 'Numérique', 'Pack Office', '', 'debutant', 'Entraînement en ligne, certification en centre', '2 à 6 semaines', 'mixte', 'https://pix.org',
        'Mesure tes compétences numériques (information, communication, création de contenu, sécurité). Entraînement en ligne gratuit.', 'Rassure un recruteur sur ton aisance numérique dès le premier poste.'],
    ['ICDL (Permis de conduire informatique)', 'ICDL Foundation', 'Numérique', 'Pack Office, Excel avancé', '', 'debutant', 'Modules et examens en centre agréé', '1 à 3 mois', 'payant', 'https://icdl.org',
        'Certification internationale des compétences bureautiques, module par module (traitement de texte, tableur, présentation…).', 'Reconnue par les administrations et les entreprises dans plus de 100 pays.'],
    ['Microsoft Office Specialist (MOS) Excel', 'Microsoft / Certiport', 'Numérique', 'Excel avancé, Pack Office', '', 'intermediaire', 'Examen en centre agréé', '1 à 2 mois', 'payant', 'https://certiport.pearsonvue.com',
        'Prouve ta maîtrise d\'Excel : formules, tableaux croisés dynamiques, graphiques, mise en forme avancée.', 'Excel est demandé dans presque toutes les offres de gestion, finance et logistique.'],
    ['Microsoft Office Specialist (MOS) Word', 'Microsoft / Certiport', 'Numérique', 'Pack Office, Secrétariat', '', 'debutant', 'Examen en centre agréé', '3 à 6 semaines', 'payant', 'https://certiport.pearsonvue.com',
        'Atteste de ta maîtrise de Word : mise en page, styles, publipostage, documents longs.', 'Un atout concret pour les postes d\'assistanat et de secrétariat.'],
    ['Certificat Voltaire', 'Projet Voltaire', 'Numérique', 'Rédaction, Secrétariat', '', 'debutant', 'Entraînement en ligne, examen en centre', '1 à 2 mois', 'payant', 'https://www.certificat-voltaire.fr',
        'Certifie ton niveau en orthographe et grammaire françaises, avec un score sur 1000.', 'Une orthographe irréprochable fait la différence dans tous les métiers de l\'écrit.'],

    // ---------- Développement & data ----------
    ['Responsive Web Design', 'freeCodeCamp', 'Développement', 'HTML / CSS', '', 'debutant', 'En ligne, à ton rythme', '1 à 2 mois', 'gratuit', 'https://www.freecodecamp.org',
        'Parcours pratique complet avec projets à réaliser pour obtenir la certification.', 'Gratuit et reconnu : les projets réalisés enrichissent directement ton portfolio.'],
    ['JavaScript Algorithms and Data Structures', 'freeCodeCamp', 'Développement', 'JavaScript', '', 'debutant', 'En ligne, à ton rythme', '2 à 3 mois', 'gratuit', 'https://www.freecodecamp.org',
        'Les bases solides de JavaScript, validées par des projets.', 'Gratuit, exigeant et très apprécié des développeurs qui recrutent.'],
    ['Meta Front-End Developer', 'Meta (Coursera)', 'Développement', 'JavaScript, HTML / CSS', '', 'intermediaire', 'En ligne, à ton rythme', '4 à 7 mois', 'payant', 'https://www.coursera.org',
        'Programme professionnalisant : HTML, CSS, JavaScript, React, avec un projet final.', 'Signé par Meta : un nom qui parle aux recruteurs du numérique. Aide financière possible sur Coursera.'],
    ['Meta Android Developer', 'Meta (Coursera)', 'Développement', 'Développement mobile', '', 'intermediaire', 'En ligne, à ton rythme', '6 à 8 mois', 'payant', 'https://www.coursera.org',
        'Apprends à concevoir et publier une application Android, de A à Z.', 'Le mobile est le premier accès à Internet en Afrique : la demande en développeurs mobiles est forte.'],
    ['Développeur web (parcours diplômant)', 'OpenClassrooms', 'Développement', 'PHP, JavaScript, HTML / CSS, SQL', '', 'intermediaire', 'En ligne avec mentor', '6 à 12 mois', 'payant', 'https://openclassrooms.com',
        'Parcours professionnalisant par projets, avec un mentor, débouchant sur un diplôme reconnu.', 'Très connu en Afrique francophone, avec des projets concrets à montrer en entretien.'],
    ['PCEP – Certified Entry-Level Python Programmer', 'Python Institute', 'Développement', 'Python', '', 'debutant', 'Cours gratuit, examen en ligne', '1 à 2 mois', 'mixte', 'https://pythoninstitute.org',
        'Valide les bases de Python. Le cours « Python Essentials » est gratuit sur Cisco Networking Academy.', 'Une première certification idéale pour la data et l\'automatisation.'],
    ['Oracle Database SQL Certified Associate', 'Oracle', 'Data', 'SQL', '', 'intermediaire', 'Examen en ligne ou en centre', '2 à 3 mois', 'payant', 'https://education.oracle.com',
        'Certifie ta maîtrise du langage SQL : requêtes, jointures, sous-requêtes, manipulation des données.', 'SQL est la compétence data la plus demandée, des banques aux télécoms.'],
    ['GitHub Foundations', 'GitHub', 'Développement', 'Git', '', 'debutant', 'Examen en ligne', '2 à 4 semaines', 'payant', 'https://resources.github.com/learn/certifications/',
        'Valide les fondamentaux de Git et de GitHub : dépôts, branches, collaboration.', 'Savoir travailler en équipe sur du code est attendu dès le premier stage.'],
    ['Google Data Analytics', 'Google (Coursera)', 'Data', 'Analyse de données, SQL, Excel avancé', '', 'debutant', 'En ligne, à ton rythme', '4 à 6 mois', 'payant', 'https://www.coursera.org',
        'Programme complet pour débuter en analyse de données : tableurs, SQL, visualisation, étude de cas finale.', 'Accessible sans prérequis. Aide financière possible sur Coursera.'],
    ['Microsoft Power BI Data Analyst (PL-300)', 'Microsoft', 'Data', 'Power BI, Analyse de données', '', 'intermediaire', 'Parcours gratuit Microsoft Learn, examen payant', '2 à 3 mois', 'mixte', 'https://learn.microsoft.com/credentials/',
        'Certifie ta capacité à préparer des données et construire des tableaux de bord Power BI.', 'Power BI fait partie des outils de reporting les plus utilisés en entreprise.'],

    // ---------- Réseaux, support, cybersécurité ----------
    ['Cisco CCNA', 'Cisco', 'Réseaux & sécurité', 'Réseaux informatiques', '', 'intermediaire', 'Formation en académie Cisco ou en ligne, examen en centre', '4 à 6 mois', 'payant', 'https://www.netacad.com',
        'La certification réseau de référence : routage, commutation, adressage IP, sécurité de base.', 'Exigée ou appréciée par les opérateurs télécoms et les intégrateurs.'],
    ['Huawei HCIA-Datacom', 'Huawei', 'Réseaux & sécurité', 'Réseaux informatiques', '', 'debutant', 'En ligne ou en académie, examen en centre', '2 à 4 mois', 'payant', 'https://e.huawei.com/en/talent',
        'Les fondamentaux des réseaux sur équipements Huawei.', 'Huawei équipe de nombreux opérateurs africains : cette certification y est très recherchée.'],
    ['CompTIA A+', 'CompTIA', 'Réseaux & sécurité', 'Support informatique', '', 'debutant', 'Deux examens en centre ou en ligne', '2 à 4 mois', 'payant', 'https://www.comptia.org',
        'La certification de base du technicien support : matériel, systèmes, dépannage.', 'Le meilleur point d\'entrée pour un premier poste en support informatique.'],
    ['Google IT Support', 'Google (Coursera)', 'Réseaux & sécurité', 'Support informatique, Réseaux informatiques', '', 'debutant', 'En ligne, à ton rythme', '3 à 6 mois', 'payant', 'https://www.coursera.org',
        'Programme complet sans prérequis : dépannage, réseaux, systèmes, sécurité.', 'Prépare aussi à la CompTIA A+. Aide financière possible sur Coursera.'],
    ['Introduction to Cybersecurity', 'Cisco Networking Academy', 'Réseaux & sécurité', 'Cybersécurité', '', 'debutant', 'En ligne, à ton rythme', '2 à 4 semaines', 'gratuit', 'https://www.netacad.com',
        'Cours gratuit avec badge numérique pour découvrir la cybersécurité.', 'Un premier pas gratuit pour montrer ton intérêt pour la sécurité.'],
    ['CompTIA Security+', 'CompTIA', 'Réseaux & sécurité', 'Cybersécurité', '', 'intermediaire', 'Examen en centre ou en ligne', '3 à 5 mois', 'payant', 'https://www.comptia.org',
        'La certification généraliste de référence en cybersécurité.', 'Banques et opérateurs renforcent leurs équipes sécurité : un profil certifié sort du lot.'],

    // ---------- Gestion de projet ----------
    ['CAPM – Certified Associate in Project Management', 'PMI', 'Gestion de projet', 'Gestion de projet', '', 'debutant', 'Examen en centre ou en ligne', '2 à 3 mois', 'payant', 'https://www.pmi.org',
        'Les fondamentaux de la gestion de projet selon le PMI, sans expérience exigée.', 'La porte d\'entrée vers la PMP, la certification projet la plus reconnue au monde.'],
    ['PRINCE2 Foundation', 'PeopleCert', 'Gestion de projet', 'Gestion de projet', '', 'debutant', 'Formation et examen en ligne', '2 à 4 semaines', 'payant', 'https://www.peoplecert.org',
        'Méthode structurée de gestion de projet, très utilisée par les institutions et bailleurs.', 'Appréciée dans les projets financés par les bailleurs internationaux.'],
    ['Professional Scrum Master I (PSM I)', 'Scrum.org', 'Gestion de projet', 'Gestion de projet', '', 'intermediaire', 'Examen en ligne', '3 à 6 semaines', 'payant', 'https://www.scrum.org',
        'Certifie ta compréhension de la méthode agile Scrum.', 'Incontournable pour les projets numériques et les équipes produit.'],
    ['Google Project Management', 'Google (Coursera)', 'Gestion de projet', 'Gestion de projet', '', 'debutant', 'En ligne, à ton rythme', '4 à 6 mois', 'payant', 'https://www.coursera.org',
        'Programme sans prérequis : planification, risques, agilité, communication.', 'Accessible aux débutants. Aide financière possible sur Coursera.'],
    ['PMD Pro / MEAL DPro', 'PM4NGOs', 'Gestion de projet', 'Suivi-évaluation, Gestion de projet', '', 'debutant', 'Guide gratuit, examen en ligne', '1 à 2 mois', 'mixte', 'https://pm4ngos.org',
        'Gestion de projet et suivi-évaluation (MEAL) adaptés au secteur du développement.', 'La référence des ONG et des organisations internationales.'],

    // ---------- HSE & sécurité ----------
    ['NEBOSH International General Certificate (IGC)', 'NEBOSH', 'HSE & sécurité', 'HSE', '', 'avance', 'Formation en centre agréé ou en ligne, examen', '2 à 4 mois', 'payant', 'https://www.nebosh.org.uk',
        'La certification internationale de référence en santé et sécurité au travail.', 'Souvent exigée pour les postes HSE dans le pétrole, les mines et le BTP.'],
    ['IOSH Managing Safely', 'IOSH', 'HSE & sécurité', 'HSE', '', 'debutant', 'Formation courte en centre ou en ligne', '3 à 4 jours', 'payant', 'https://iosh.com',
        'Formation courte aux bases de la gestion des risques au travail.', 'Un premier jalon HSE rapide à obtenir, apprécié des industriels.'],
    ['BOSIET (sécurité offshore)', 'OPITO', 'HSE & sécurité', 'HSE', '', 'debutant', 'Formation pratique en centre agréé', '3 jours', 'payant', 'https://opito.com',
        'Formation de base à la sécurité offshore : survie en mer, évacuation d\'hélicoptère, premiers secours, lutte incendie.', 'Généralement exigée pour travailler sur une plateforme pétrolière en mer.'],
    ['Sensibilisation H2S', 'OPITO', 'HSE & sécurité', 'HSE', '', 'debutant', 'Formation pratique en centre agréé', '1 jour', 'payant', 'https://opito.com',
        'Connaître les dangers du sulfure d\'hydrogène et les bons réflexes de protection.', 'Couramment demandée sur les sites pétroliers et gaziers.'],
    ['Sauveteur secouriste du travail (premiers secours)', 'Croix-Rouge et organismes agréés', 'HSE & sécurité', 'HSE, Soins infirmiers', '', 'debutant', 'Formation pratique en présentiel', '2 jours', 'payant', '',
        'Les gestes qui sauvent sur le lieu de travail, validés par une mise en situation.', 'Un plus apprécié dans tous les secteurs, et un vrai service rendu.'],
    ['Habilitation électrique', 'Organismes de formation agréés', 'HSE & sécurité', 'Électricité industrielle, Maintenance industrielle', '', 'debutant', 'Formation théorique et pratique en présentiel', '2 à 3 jours', 'payant', '',
        'Autorise à intervenir en sécurité sur ou à proximité d\'installations électriques, selon le niveau (B0, BR, BC…).', 'Indispensable pour les métiers de l\'électricité et de la maintenance industrielle.'],

    // ---------- Finance, comptabilité, droit ----------
    ['Formation certifiante SYSCOHADA révisé', 'Écoles et cabinets agréés', 'Finance & comptabilité', 'Comptabilité générale, Fiscalité, Analyse financière', '', 'intermediaire', 'Présentiel ou en ligne', '1 à 2 mois', 'payant', '',
        'Le référentiel comptable des 17 pays de l\'espace OHADA, dont le Gabon : états financiers, opérations courantes, clôture.', 'Incontournable pour tout poste en comptabilité au Gabon.'],
    ['ACCA Foundations in Accountancy', 'ACCA', 'Finance & comptabilité', 'Comptabilité générale, Contrôle de gestion', '', 'debutant', 'Examens en ligne ou en centre', '6 à 12 mois', 'payant', 'https://www.accaglobal.com',
        'Premières qualifications de l\'ACCA : comptabilité, gestion, fiscalité.', 'Une marque internationale reconnue par les cabinets d\'audit et les grandes entreprises.'],
    ['Financial Modeling & Valuation Analyst (FMVA)', 'Corporate Finance Institute', 'Finance & comptabilité', 'Analyse financière, Contrôle de gestion, Excel avancé', '', 'intermediaire', 'En ligne, à ton rythme', '3 à 6 mois', 'payant', 'https://corporatefinanceinstitute.com',
        'Modélisation financière sur Excel, analyse des états financiers, évaluation d\'entreprise.', 'Très concret pour les métiers de l\'analyse crédit et du contrôle de gestion.'],
    ['Formation certifiante Sage 100 Comptabilité', 'Partenaires agréés Sage', 'Finance & comptabilité', 'Sage Comptabilité, Comptabilité générale', '', 'debutant', 'Présentiel ou en ligne', '1 à 3 semaines', 'payant', '',
        'Maîtrise du logiciel comptable le plus utilisé par les PME : saisie, lettrage, rapprochement, états.', 'Opérationnel dès ton arrivée dans un service comptable.'],
    ['Formation certifiante en droit OHADA', 'ERSUMA (École régionale de la magistrature de l\'OHADA)', 'Droit', 'Droit des affaires', '', 'intermediaire', 'Sessions en présentiel ou à distance', 'Variable', 'payant', 'https://www.ohada.org',
        'Droit des sociétés, sûretés, procédures collectives et arbitrage dans l\'espace OHADA.', 'La référence pour les juristes d\'entreprise en Afrique francophone.'],

    // ---------- Marketing, vente, design ----------
    ['Les fondamentaux du marketing numérique', 'Google Ateliers Numériques', 'Marketing & vente', 'Marketing digital', '', 'debutant', 'En ligne, à ton rythme', '1 à 2 mois', 'gratuit', 'https://learndigital.withgoogle.com/ateliersnumeriques',
        'Formation gratuite en français couvrant référencement, réseaux sociaux, publicité, e-commerce et analyse.', 'Gratuite et en français : le meilleur point de départ en marketing digital.'],
    ['Certification Google Ads', 'Google Skillshop', 'Marketing & vente', 'Marketing digital', '', 'intermediaire', 'En ligne', '2 à 4 semaines', 'gratuit', 'https://skillshop.withgoogle.com',
        'Certifie ta capacité à créer et optimiser des campagnes publicitaires Google.', 'Gratuite et reconnue par les agences et annonceurs.'],
    ['Inbound Marketing et Social Media Marketing', 'HubSpot Academy', 'Marketing & vente', 'Marketing digital, Gestion des réseaux sociaux', '', 'debutant', 'En ligne, à ton rythme', '2 à 4 semaines', 'gratuit', 'https://academy.hubspot.com',
        'Attirer et fidéliser des clients grâce au contenu et aux réseaux sociaux.', 'Gratuit, rapide, et apprécié des recruteurs en communication.'],
    ['Meta Certified Digital Marketing Associate', 'Meta Blueprint', 'Marketing & vente', 'Gestion des réseaux sociaux, Marketing digital', '', 'intermediaire', 'Examen en ligne', '1 à 2 mois', 'payant', 'https://www.facebook.com/business/learn/certification',
        'Certifie ta maîtrise de la publicité et de la communication sur Facebook et Instagram.', 'Facebook et Instagram sont des canaux majeurs pour les marques : savoir y faire de la publicité est un vrai plus.'],
    ['Inbound Sales', 'HubSpot Academy', 'Marketing & vente', 'Techniques de vente, Gestion de la relation client', '', 'debutant', 'En ligne, à ton rythme', '1 à 2 semaines', 'gratuit', 'https://academy.hubspot.com',
        'Méthode de vente moderne : prospection, qualification, conseil, closing.', 'Gratuit et directement applicable en entretien commercial.'],
    ['Adobe Certified Professional (Photoshop, Illustrator)', 'Adobe / Certiport', 'Marketing & vente', 'Création graphique', '', 'intermediaire', 'Examen en centre agréé', '1 à 3 mois', 'payant', 'https://certiport.pearsonvue.com',
        'Certifie ta maîtrise des logiciels de création Adobe.', 'Rassure les agences sur ton niveau technique, en plus de ton portfolio.'],
    ['Google UX Design', 'Google (Coursera)', 'Marketing & vente', 'Création graphique', '', 'debutant', 'En ligne, à ton rythme', '4 à 6 mois', 'payant', 'https://www.coursera.org',
        'Conception d\'interfaces centrée utilisateur, avec 3 projets pour ton portfolio.', 'Le portfolio produit pendant la formation compte autant que le certificat.'],

    // ---------- Industrie, BTP, énergie, environnement ----------
    ['Autodesk Certified Professional – AutoCAD', 'Autodesk', 'Industrie & BTP', 'AutoCAD, Génie civil, Topographie', '', 'intermediaire', 'Examen en centre ou en ligne', '1 à 3 mois', 'payant', 'https://www.autodesk.com/certification',
        'Certifie ta maîtrise d\'AutoCAD pour le dessin technique 2D et 3D.', 'Demandé par les bureaux d\'études, le BTP et les sociétés minières.'],
    ['Autodesk Certified Professional – Revit', 'Autodesk', 'Industrie & BTP', 'Génie civil', '', 'intermediaire', 'Examen en centre ou en ligne', '2 à 4 mois', 'payant', 'https://www.autodesk.com/certification',
        'Modélisation BIM des bâtiments avec Revit.', 'Le BIM se généralise sur les grands chantiers : un atout pour se démarquer.'],
    ['ArcGIS Pro Associate', 'Esri', 'Industrie & BTP', 'SIG / Cartographie, Gestion forestière, Géologie', '', 'intermediaire', 'Examen en centre ou en ligne', '2 à 3 mois', 'payant', 'https://www.esri.com/training/certification',
        'Certifie ta maîtrise d\'ArcGIS Pro : données, analyses spatiales, cartes.', 'Recherché dans la forêt, les mines, l\'environnement et l\'aménagement du territoire.'],
    ['NABCEP PV Associate', 'NABCEP', 'Industrie & BTP', 'Énergie solaire', '', 'debutant', 'Formation en ligne, examen', '1 à 2 mois', 'payant', 'https://www.nabcep.org',
        'Les bases du solaire photovoltaïque : conception, installation, sécurité.', 'Le solaire hors réseau se développe vite dans les zones rurales.'],

    // ---------- Logistique ----------
    ['CILT International Certificate in Logistics and Transport', 'CILT International', 'Logistique', 'Logistique, Gestion des stocks, Transit & douane', '', 'debutant', 'Formation en centre ou en ligne', '3 à 6 mois', 'payant', 'https://ciltinternational.org',
        'Les fondamentaux de la logistique, du transport et de la chaîne d\'approvisionnement.', 'Reconnue par les transitaires, ports et entreprises minières.'],
    ['CPIM – Planification et gestion des stocks', 'ASCM', 'Logistique', 'Gestion des stocks, Logistique', '', 'avance', 'En ligne, examen en centre', '4 à 8 mois', 'payant', 'https://www.ascm.org',
        'Planification de la production, gestion des stocks et des approvisionnements.', 'Une certification avancée pour viser des postes de responsable logistique.'],

    // ---------- Santé, hôtellerie, agro ----------
    ['BLS – Basic Life Support', 'American Heart Association', 'Santé', 'Soins infirmiers', '', 'debutant', 'Formation pratique en centre agréé', '1 jour', 'payant', 'https://cpr.heart.org',
        'Réanimation cardio-pulmonaire et défibrillation, selon les standards internationaux.', 'Appréciée dans les cliniques, les ONG de santé et les sites industriels.'],
    ['HACCP – Hygiène et sécurité alimentaire', 'Organismes de formation agréés', 'Hôtellerie & agro', 'Cuisine, Accueil & hôtellerie, Agronomie', '', 'debutant', 'Formation courte en présentiel ou en ligne', '2 à 3 jours', 'payant', '',
        'La méthode de maîtrise des risques sanitaires en restauration et dans l\'agroalimentaire.', 'Souvent exigée en restauration, hôtellerie et industrie agroalimentaire.'],
    ['Certified Guest Service Professional (CGSP)', 'AHLEI', 'Hôtellerie & agro', 'Accueil & hôtellerie, Gestion de la relation client', '', 'debutant', 'En ligne, examen', '2 à 4 semaines', 'payant', 'https://www.ahlei.org',
        'Les standards internationaux de l\'accueil et du service client en hôtellerie.', 'Appréciée par les hôtels et lodges qui accueillent une clientèle internationale.'],
    ['GLOBALG.A.P. (bonnes pratiques agricoles)', 'GLOBALG.A.P.', 'Hôtellerie & agro', 'Agronomie', '', 'intermediaire', 'Formation en présentiel ou en ligne', '1 à 4 semaines', 'payant', 'https://www.globalgap.org',
        'Le référentiel international des bonnes pratiques agricoles : traçabilité, sécurité alimentaire, environnement.', 'Recherché par les exploitations qui visent l\'export.'],

    // ---------- RH ----------
    ['CIPD Level 3 Foundation Certificate in People Practice', 'CIPD', 'RH & administration', 'Gestion des ressources humaines', '', 'debutant', 'En ligne ou en centre', '6 à 12 mois', 'payant', 'https://www.cipd.org',
        'Les fondamentaux des ressources humaines : recrutement, droit social, développement des talents.', 'Une certification internationale reconnue pour débuter en RH.'],
];
