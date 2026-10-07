<?php
declare(strict_types=1);

/*
 * Données TREMPLIN by NEAM.
 * - Référentiels (pays, villes, secteurs, compétences, métiers, formations, offres, paramètres) et conseils : toujours chargés.
 * - Démonstration ($demo = true) : entreprises, écoles, personnes et offres fictives.
 */

use App\Core\DB;
use App\Services\EmployabilityService;
use App\Services\MatchingEngine;
use App\Services\ProfileService;

return function (bool $demo = true): void {
    mt_srand(2026);
    $pdo = DB::pdo();
    $pdo->beginTransaction();
    $ago = fn(int $days, int $h = 10) => date('Y-m-d H:i:s', strtotime("-$days days") - ($h * 3600) % 86400);
    $pwd = password_hash('Tremplin2026!', PASSWORD_DEFAULT);

    /* ---------- Pays & villes ---------- */
    $countries = [
        'GA' => ['Gabon', '+241', ['Libreville', 'Port-Gentil', 'Franceville', 'Oyem', 'Moanda', 'Lambaréné', 'Mouila', 'Akanda', 'Owendo', 'Ntoum', 'Tchibanga', 'Makokou', 'Koulamoutou']],
        'CM' => ['Cameroun', '+237', ['Douala', 'Yaoundé']],
        'CG' => ['Congo', '+242', ['Brazzaville', 'Pointe-Noire']],
        'CI' => ['Côte d\'Ivoire', '+225', ['Abidjan']],
        'SN' => ['Sénégal', '+221', ['Dakar']],
        'GQ' => ['Guinée équatoriale', '+240', ['Malabo', 'Bata']],
    ];
    $city = [];
    foreach ($countries as $code => [$name, $prefix, $cities]) {
        $cid = DB::insert('countries', ['code' => $code, 'name' => $name, 'currency' => 'FCFA', 'phone_prefix' => $prefix, 'active' => 1]);
        foreach ($cities as $c) {
            $city[$c] = DB::insert('cities', ['country_id' => $cid, 'name' => $c]);
        }
    }

    /* ---------- Secteurs ---------- */
    $sectorList = [
        'Numérique & Télécoms' => 'smartphone', 'Banque, Finance & Assurance' => 'wallet', 'Pétrole, Mines & Énergie' => 'zap',
        'Bois, Forêt & Environnement' => 'compass', 'BTP & Industrie' => 'building-2', 'Santé & Pharmacie' => 'activity',
        'Commerce & Distribution' => 'ticket', 'Logistique & Transport' => 'route', 'Hôtellerie & Tourisme' => 'star',
        'Agriculture & Agro-industrie' => 'target', 'Éducation & Formation' => 'graduation-cap', 'ONG & Institutions' => 'handshake',
        'Marketing & Communication' => 'sparkles', 'Administration & Ressources humaines' => 'users',
    ];
    $sector = [];
    foreach ($sectorList as $n => $ic) {
        $sector[$n] = DB::insert('sectors', ['name' => $n, 'slug' => slugify($n), 'icon' => $ic]);
    }
    $S = fn(string $prefix) => $sector[array_values(array_filter(array_keys($sector), fn($k) => str_starts_with($k, $prefix)))[0]];

    /* ---------- Compétences ---------- */
    $skillList = [
        // tech
        ['PHP', 'tech', 'laravel,symfony'], ['JavaScript', 'tech', 'js,react,vue,node'], ['Python', 'tech', ''], ['SQL', 'tech', 'mysql,postgresql,base de donnees'],
        ['HTML / CSS', 'tech', 'html,css,tailwind'], ['Développement mobile', 'tech', 'flutter,android,kotlin,react native'], ['Réseaux informatiques', 'tech', 'cisco,tcp ip,lan'],
        ['Cybersécurité', 'tech', 'securite informatique'], ['Support informatique', 'tech', 'helpdesk,maintenance informatique'], ['Git', 'tech', 'github,gitlab'],
        ['Excel avancé', 'tech', 'excel,tableur,tableaux croises'], ['Power BI', 'tech', 'tableau de bord,dashboard'], ['Analyse de données', 'tech', 'data,statistiques,data analysis'],
        ['Comptabilité générale', 'tech', 'comptabilite,ohada,syscohada'], ['Contrôle de gestion', 'tech', 'budget,reporting financier'], ['Analyse financière', 'tech', 'finance'],
        ['Fiscalité', 'tech', 'impots,tva'], ['Sage Comptabilité', 'tech', 'sage'], ['Gestion de la relation client', 'tech', 'crm,relation client,service client'],
        ['Techniques de vente', 'tech', 'vente,prospection,commercial'], ['Marketing digital', 'tech', 'seo,sea,google ads'], ['Gestion des réseaux sociaux', 'tech', 'community management,facebook,instagram,tiktok'],
        ['Création graphique', 'tech', 'photoshop,illustrator,canva,figma'], ['Rédaction', 'tech', 'redaction web,copywriting'], ['Gestion de projet', 'tech', 'project management,planification'],
        ['Logistique', 'tech', 'supply chain,approvisionnement'], ['Gestion des stocks', 'tech', 'inventaire,magasinage'], ['Transit & douane', 'tech', 'transit,dedouanement'],
        ['HSE', 'tech', 'qhse,hygiene securite environnement'], ['Électricité industrielle', 'tech', 'electricite,electrotechnique'], ['Maintenance industrielle', 'tech', 'mecanique,maintenance'],
        ['AutoCAD', 'tech', 'dao,cao'], ['Topographie', 'tech', 'geometre'], ['Génie civil', 'tech', 'btp,construction'], ['Géologie', 'tech', 'geosciences'],
        ['Énergie solaire', 'tech', 'photovoltaique,solaire'], ['Gestion forestière', 'tech', 'foret,sylviculture,amenagement forestier'], ['SIG / Cartographie', 'tech', 'qgis,arcgis,sig'],
        ['Agronomie', 'tech', 'agriculture'], ['Soins infirmiers', 'tech', 'infirmier,infirmiere'], ['Pharmacie', 'tech', 'dispensation'],
        ['Accueil & hôtellerie', 'tech', 'reception,hotellerie'], ['Cuisine', 'tech', 'restauration,chef'], ['Gestion des ressources humaines', 'tech', 'rh,paie,recrutement'],
        ['Droit des affaires', 'tech', 'juridique,ohada droit'], ['Secrétariat', 'tech', 'assistanat,bureautique'], ['Pack Office', 'tech', 'word,powerpoint,microsoft office'],
        ['Suivi-évaluation', 'tech', 'monitoring,m&e,suivi evaluation'], ['Enseignement', 'tech', 'pedagogie,formation'],
        // soft
        ['Travail en équipe', 'soft', 'esprit d equipe'], ['Communication', 'soft', 'communication orale'], ['Rigueur', 'soft', 'precision'],
        ['Autonomie', 'soft', ''], ['Leadership', 'soft', ''], ['Adaptabilité', 'soft', 'flexibilite'], ['Sens de l\'organisation', 'soft', 'organisation'],
        ['Résolution de problèmes', 'soft', 'esprit d analyse'], ['Créativité', 'soft', ''], ['Gestion du stress', 'soft', 'resistance au stress'],
    ];
    $skill = [];
    foreach ($skillList as [$n, $cat, $al]) {
        $skill[$n] = DB::insert('skills', ['name' => $n, 'slug' => slugify($n), 'category' => $cat, 'aliases' => $al]);
    }

    /* ---------- Familles de métiers (RIASEC) ---------- */
    $families = [
        ['Développeur·se web / mobile', 'Numérique', 'IRC', 'Conçoit et code des sites, applications et services numériques.', 'PHP,JavaScript,SQL,Développement mobile', 4, 'très forte'],
        ['Data analyst', 'Numérique', 'ICR', 'Transforme les données en tableaux de bord et recommandations.', 'Analyse de données,SQL,Power BI,Python', 5, 'très forte'],
        ['Technicien·ne réseaux & télécoms', 'Numérique', 'RIC', 'Installe et maintient réseaux, fibre et équipements télécoms.', 'Réseaux informatiques,Support informatique', 3, 'forte'],
        ['Analyste cybersécurité', 'Numérique', 'ICR', 'Protège les systèmes d\'information contre les attaques.', 'Cybersécurité,Réseaux informatiques', 5, 'très forte'],
        ['UX/UI designer', 'Marketing', 'AIE', 'Imagine des interfaces simples et agréables.', 'Création graphique,HTML / CSS', 4, 'forte'],
        ['Community manager', 'Marketing', 'AES', 'Anime les réseaux sociaux et la communauté d\'une marque.', 'Gestion des réseaux sociaux,Rédaction,Marketing digital', 3, 'forte'],
        ['Chargé·e de communication', 'Marketing', 'AES', 'Valorise l\'image d\'une organisation.', 'Rédaction,Création graphique', 4, 'bonne'],
        ['Comptable', 'Banque', 'CIE', 'Tient les comptes et prépare les états financiers (SYSCOHADA).', 'Comptabilité générale,Fiscalité,Sage Comptabilité', 3, 'forte'],
        ['Analyste financier·ère / crédit', 'Banque', 'CIE', 'Évalue la santé financière et les risques.', 'Analyse financière,Excel avancé', 5, 'bonne'],
        ['Conseiller·ère clientèle bancaire', 'Banque', 'ESC', 'Accompagne les clients dans leurs projets financiers.', 'Gestion de la relation client,Techniques de vente', 3, 'forte'],
        ['Commercial·e terrain', 'Commerce', 'ESR', 'Développe le chiffre d\'affaires auprès des clients.', 'Techniques de vente,Gestion de la relation client', 2, 'très forte'],
        ['Responsable logistique', 'Logistique', 'CER', 'Organise les flux de marchandises et les stocks.', 'Logistique,Gestion des stocks,Transit & douane', 4, 'forte'],
        ['Technicien·ne HSE', 'Pétrole', 'RCS', 'Veille à la sécurité des personnes et de l\'environnement sur site.', 'HSE', 3, 'très forte'],
        ['Électrotechnicien·ne', 'Pétrole', 'RIC', 'Installe et dépanne les équipements électriques industriels.', 'Électricité industrielle,Maintenance industrielle', 3, 'très forte'],
        ['Géologue', 'Pétrole', 'IRC', 'Étudie les sols et sous-sols pour l\'exploration minière et pétrolière.', 'Géologie,SIG / Cartographie', 6, 'bonne'],
        ['Ingénieur·e génie civil', 'BTP', 'RIE', 'Conçoit et pilote des ouvrages et infrastructures.', 'Génie civil,AutoCAD,Gestion de projet', 6, 'forte'],
        ['Technicien·ne énergie solaire', 'Pétrole', 'RIC', 'Installe des systèmes photovoltaïques.', 'Énergie solaire,Électricité industrielle', 3, 'très forte'],
        ['Ingénieur·e forestier·ère', 'Bois', 'RIC', 'Gère durablement les forêts et les concessions.', 'Gestion forestière,SIG / Cartographie', 5, 'forte'],
        ['Agronome', 'Agriculture', 'IRS', 'Améliore la production agricole et la sécurité alimentaire.', 'Agronomie', 5, 'forte'],
        ['Infirmier·ère', 'Santé', 'SRI', 'Prodigue des soins et accompagne les patients.', 'Soins infirmiers', 3, 'très forte'],
        ['Chargé·e RH', 'Administration', 'SEC', 'Recrute, forme et accompagne les collaborateurs.', 'Gestion des ressources humaines,Droit des affaires', 4, 'bonne'],
        ['Assistant·e de direction', 'Administration', 'CSE', 'Organise l\'activité d\'une direction.', 'Secrétariat,Pack Office', 3, 'bonne'],
        ['Chargé·e de suivi-évaluation (ONG)', 'ONG', 'SIC', 'Mesure l\'impact des projets de développement.', 'Suivi-évaluation,Analyse de données', 5, 'bonne'],
        ['Réceptionniste / hôtellerie', 'Hôtellerie', 'SEC', 'Accueille et prend soin des clients.', 'Accueil & hôtellerie,Communication', 2, 'bonne'],
        ['Entrepreneur·e', 'Commerce', 'ESA', 'Crée et développe sa propre activité.', 'Gestion de projet,Techniques de vente', 2, 'forte'],
        ['Enseignant·e / formateur·rice', 'Éducation', 'SAI', 'Transmet des savoirs et accompagne les apprenants.', 'Enseignement,Communication', 4, 'bonne'],
    ];
    foreach ($families as [$n, $sec, $code, $desc, $sk, $edu, $out]) {
        DB::insert('job_families', ['name' => $n, 'sector_id' => $S($sec), 'riasec' => $code, 'description' => $desc, 'skills' => $sk, 'education_min' => $edu, 'outlook' => $out]);
    }

    /* ---------- Plateformes de formation en ligne et leurs cours (catalogue réel) ---------- */
    \Database\Migrator::seedLearning();
    \Database\Migrator::seedCertifications();

    /* ---------- Offres d'abonnement ---------- */
    $plans = [
        ['FREE', 'Free', 'candidate', 0, 'Découvrir Tremplin', ['Profil et CV (1 modèle)', 'Recherche et alertes', 'Score de compatibilité', 'Test d\'orientation RIASEC', '5 candidatures / mois'], ['applications' => 5], 0, 1],
        ['STARTER', 'Starter', 'candidate', 2000, 'Candidat actif', ['Tout Free +', '20 candidatures / mois', '3 modèles de CV premium', 'Lettres de motivation IA', 'Historique des versions de CV'], ['applications' => 20], 0, 2],
        ['PRO', 'Pro', 'candidate', 5000, 'Accompagnement renforcé', ['Tout Starter +', 'Candidatures illimitées', 'Recommandations avancées', 'Plan d\'action 30/60/90 jours', 'Lettres adaptées à chaque offre'], ['applications' => null], 1, 3],
        ['PREMIUM', 'Premium', 'candidate', 10000, 'Employabilité avancée', ['Tout Pro +', 'Simulateur d\'entretien avec feedback', 'Profil mis en avant auprès des recruteurs', 'Badge « Profil vérifié »'], ['applications' => null], 0, 4],
        ['CAREER', 'Career', 'candidate', 15000, 'Parcours complet', ['Tout Premium +', 'Coaching carrière mensuel', 'Revue de CV par un expert NEAM', 'Accès prioritaire aux événements'], ['applications' => null], 0, 5],
        ['BIZ_FREE', 'Entreprise Découverte', 'company', 0, 'Pour démarrer', ['3 offres actives', 'Matching automatique', 'Gestion des candidatures'], ['jobs' => 3], 0, 10],
        ['BIZ_PRO', 'Entreprise Pro', 'company', 50000, 'Recruter régulièrement', ['15 offres actives', 'Accès CVthèque', 'Statistiques avancées', 'Multi-recruteurs'], ['jobs' => 15], 1, 11],
        ['BIZ_ENTERPRISE', 'Entreprise Plus', 'company', 150000, 'Grands comptes', ['Offres illimitées', 'Matching avancé', 'Account manager NEAM', 'API partenaire'], ['jobs' => null], 0, 12],
        ['SCHOOL', 'Licence Établissement', 'school', 250000, 'Écoles et universités', ['Suivi illimité des étudiants', 'Tableau des stages', 'Rapports d\'insertion', 'Diffusion ciblée'], ['students' => null], 0, 20],
    ];
    foreach ($plans as [$code, $n, $aud, $price, $tag, $feat, $lim, $hl, $sort]) {
        DB::insert('plans', ['code' => $code, 'name' => $n, 'audience' => $aud, 'price' => $price, 'tagline' => $tag,
            'features' => json_encode($feat, JSON_UNESCAPED_UNICODE), 'limits' => json_encode($lim), 'highlight' => $hl, 'sort' => $sort]);
    }
    DB::insert('coupons', ['code' => 'BIENVENUE25', 'percent' => 25, 'max_uses' => 500, 'uses' => 0, 'expires_at' => date('Y-12-31'), 'active' => 1]);
    DB::insert('coupons', ['code' => 'ETUDIANT50', 'percent' => 50, 'max_uses' => 200, 'uses' => 0, 'expires_at' => date('Y-12-31'), 'active' => 1]);

    /* ---------- Poids de matching ---------- */
    foreach (MatchingEngine::CRITERIA as $k => [, $w]) {
        DB::insert('matching_weights', ['sector_id' => null, 'criterion' => $k, 'weight' => $w]);
    }
    // Exemple de calibrage sectoriel : le pétrole valorise davantage l'expérience et les langues (HSE, anglais)
    foreach (['skills' => 28, 'education' => 12, 'experience' => 20, 'job_title' => 8, 'location' => 8, 'availability' => 5, 'languages' => 10, 'soft_skills' => 4, 'preferences' => 5] as $k => $w) {
        DB::insert('matching_weights', ['sector_id' => $S('Pétrole'), 'criterion' => $k, 'weight' => $w]);
    }

    /* ---------- Paramètres ---------- */
    foreach ([
        'ai_enabled' => '1', 'launch_mode' => '1', 'ai_monthly_limit' => '30', 'match_alert_threshold' => '70', 'maintenance' => '0',
    ] as $k => $v) {
        DB::insert('settings', ['skey' => $k, 'svalue' => $v]);
    }

    /* ---------- Conseils (contenus éditoriaux) ---------- */
    $articles = [
        ['Réussir son CV quand on n\'a pas d\'expérience', 'cv', '#0057ff', "Pas d'expérience professionnelle ? Pas de panique : les recruteurs gabonais savent que tout le monde commence un jour. L'essentiel est de montrer ce que tu sais faire.\n\nMets en avant tes projets\nProjet de fin d'études, association, tontine que tu as aidée à organiser, petit commerce familial : chaque projet prouve une compétence. Décris ce que TU as fait et le résultat obtenu.\n\nSois précis·e sur tes compétences\nPlutôt que « maîtrise de l'informatique », écris « Excel : tableaux croisés dynamiques, formules RECHERCHEV ».\n\nSoigne la forme\n- Une page maximum\n- Une photo professionnelle (fond neutre, tenue correcte)\n- Un e-mail sérieux (prenom.nom@…)\n- Aucune faute d'orthographe\n\nAvec Tremplin, ton CV est généré automatiquement à partir de ton profil : il suffit de le compléter."],
        ['5 questions d\'entretien à préparer absolument', 'entretien', '#f59e0b', "L'entretien se prépare comme un examen. Voici les questions qui reviennent presque toujours.\n\n1. Présentez-vous\nDeux minutes : ton parcours, tes compétences, ce que tu cherches. Termine par le lien avec le poste.\n\n2. Pourquoi notre entreprise ?\nRenseigne-toi : activité, actualités, valeurs. Montre que tu ne postules pas au hasard.\n\n3. Quelles sont vos qualités et vos défauts ?\nIllustre chaque qualité par un exemple. Pour le défaut, montre comment tu travailles à l'améliorer.\n\n4. Racontez une difficulté que vous avez surmontée\nUtilise la méthode STAR : Situation, Tâche, Action, Résultat.\n\n5. Avez-vous des questions ?\nToujours oui ! Interroge sur l'équipe, les missions, l'intégration.\n\nEntraîne-toi avec le simulateur d'entretien Tremplin : il analyse tes réponses et te donne des conseils."],
        ['Les métiers qui recrutent au Gabon en ce moment', 'marche', '#10b981', "Le marché de l'emploi gabonais évolue avec la diversification de l'économie. Voici les secteurs les plus dynamiques.\n\nNumérique et télécoms\nDéveloppeurs, techniciens réseaux, data analysts et spécialistes de la cybersécurité sont très recherchés, notamment avec l'essor du mobile money.\n\nÉnergie et mines\nTechniciens HSE, électrotechniciens et géologues restent demandés à Port-Gentil et dans le Haut-Ogooué. Les énergies renouvelables (solaire) créent de nouveaux métiers.\n\nBois et environnement\nLa transformation locale du bois et la gestion durable des forêts ouvrent des postes d'ingénieurs forestiers et de techniciens SIG.\n\nAgriculture et agro-industrie\nLa sécurité alimentaire est une priorité : agronomes et techniciens agricoles sont attendus.\n\nPasse le test d'orientation Tremplin pour découvrir les métiers qui te correspondent."],
        ['Stage : comment transformer l\'essai en emploi', 'stage', '#8b5cf6', "Un stage réussi est souvent la meilleure porte d'entrée vers un premier emploi.\n\nSois ponctuel·le et fiable\nC'est la base. Arrive à l'heure, respecte les délais, préviens en cas d'empêchement.\n\nPose des questions\nUn stagiaire curieux apprend plus vite et montre son intérêt.\n\nPrends des initiatives\nPropose une amélioration, même petite : un fichier mieux organisé, une procédure documentée.\n\nCrée ton réseau\nDéjeune avec les équipes, demande des conseils. Les recommandations internes comptent énormément.\n\nFais un bilan avant de partir\nDemande un retour à ton tuteur et une attestation. Ajoute ensuite cette expérience à ton profil Tremplin."],
        ['Lettre de motivation : la méthode en 4 paragraphes', 'cv', '#ec4899', "Une bonne lettre est courte, personnalisée et orientée vers l'entreprise.\n\n1. L'accroche\nPourquoi cette offre t'intéresse, en une ou deux phrases.\n\n2. Ce que tu apportes\nTes compétences clés, illustrées par des exemples concrets.\n\n3. Pourquoi eux\nCe qui t'attire dans l'entreprise : projets, secteur, valeurs.\n\n4. La conclusion\nTa disponibilité et ta demande d'entretien.\n\nLe générateur de lettres Tremplin adapte automatiquement ta lettre à chaque offre à partir de ton profil."],
        ['Mobile Money, réseaux sociaux : soigner son image en ligne', 'conseil', '#0ea5e9', "Les recruteurs regardent de plus en plus les profils en ligne des candidats.\n\nVérifie ce qui est public\nPhotos, commentaires, publications : fais le tri sur Facebook, Instagram et TikTok.\n\nCrée un profil LinkedIn\nMême simple, il montre ton sérieux. Reprends les informations de ton profil Tremplin.\n\nSois cohérent·e\nLes informations de ton CV, de LinkedIn et de Tremplin doivent être identiques.\n\nProtège tes données\nNe partage jamais tes codes Mobile Money ni tes documents d'identité avec un « recruteur » qui te les demande : c'est une arnaque. Signale-le sur Tremplin."],
    ];
    foreach ($articles as $i => [$t, $cat, $color, $body]) {
        DB::insert('contents', ['slug' => slugify($t), 'title' => $t, 'category' => $cat, 'excerpt' => excerpt(explode("\n", $body)[0], 160), 'body' => $body, 'cover_color' => $color, 'reading_minutes' => 3 + $i % 3, 'published' => 1, 'created_at' => $ago(5 + $i * 6)]);
    }

    if (!$demo) {
        // Production : référentiels et conseils uniquement, aucune donnée fictive
        $pdo->commit();
        return;
    }

    /* ---------- Utilisateurs ---------- */
    $mkUser = function (string $role, string $email, string $first, string $last, ?string $phone, string $plan = 'FREE', int $daysAgo = 120) use ($pwd, $ago) {
        return DB::insert('users', [
            'role' => $role, 'email' => $email, 'phone' => $phone, 'password_hash' => $pwd, 'first_name' => $first, 'last_name' => $last,
            'status' => 'active', 'plan_code' => $plan, 'plan_expires_at' => $plan !== 'FREE' ? date('Y-m-d H:i:s', strtotime('+24 days')) : null,
            'notify_email' => 1, 'notify_sms' => $role === 'candidate' ? 1 : 0, 'alert_frequency' => 'instant', 'consent_marketing' => 1,
            'email_verified_at' => $ago($daysAgo), 'last_login_at' => $ago(mt_rand(0, 6)), 'created_at' => $ago($daysAgo), 'updated_at' => $ago(1),
        ]);
    };

    $admin = $mkUser('admin', 'admin@tremplin.ga', 'Aïcha', 'Ndong', '+241 77 00 00 01', 'FREE', 200);

    /* ---------- Entreprises ---------- */
    $companyDefs = [
        ['OkoumeTech', 'Numérique', 'Libreville', '11-50', '#0057ff', 'Studio numérique gabonais : applications mobiles, plateformes web et solutions cloud pour les entreprises et administrations d\'Afrique centrale.'],
        ['Banque de l\'Estuaire', 'Banque', 'Libreville', '250+', '#0f766e', 'Banque commerciale engagée pour l\'inclusion financière des jeunes et des PME, présente dans les 9 provinces du Gabon.'],
        ['Ogooué Énergies Services', 'Pétrole', 'Port-Gentil', '51-250', '#f59e0b', 'Prestataire de services parapétroliers et énergies renouvelables : maintenance, HSE et installations solaires.'],
        ['Akanda Logistique', 'Logistique', 'Owendo', '51-250', '#7c3aed', 'Transit, entreposage et distribution depuis le port d\'Owendo vers tout le Gabon et la sous-région.'],
        ['Komo Telecom', 'Numérique', 'Libreville', '250+', '#e11d48', 'Opérateur de services télécoms et mobile money au Gabon.'],
        ['Green Forest Gabon', 'Bois', 'Lambaréné', '51-250', '#16a34a', 'Exploitation forestière certifiée et transformation locale du bois, engagée pour la gestion durable des forêts.'],
        ['Santé Plus Gabon', 'Santé', 'Libreville', '51-250', '#0ea5e9', 'Réseau de cliniques et pharmacies offrant des soins de qualité à Libreville, Franceville et Port-Gentil.'],
        ['Lopé Hôtels & Lodges', 'Hôtellerie', 'Libreville', '11-50', '#b45309', 'Hôtellerie et écotourisme au cœur des parcs nationaux du Gabon.'],
        ['Nyanga Agro', 'Agriculture', 'Tchibanga', '11-50', '#65a30d', 'Agro-industrie : production maraîchère, transformation du manioc et distribution en circuits courts.'],
        ['Estuaire Consulting', 'Administration', 'Libreville', '11-50', '#334155', 'Cabinet de conseil en organisation, ressources humaines et finance pour PME et institutions.'],
        ['Fondation Jeunesse Active', 'ONG', 'Franceville', '11-50', '#db2777', 'ONG d\'insertion des jeunes : formation, entrepreneuriat et accompagnement vers l\'emploi.'],
        ['Mbadi Distribution', 'Commerce', 'Libreville', '51-250', '#ea580c', 'Grande distribution et commerce de détail : supermarchés et supérettes de proximité.'],
    ];
    $companies = [];
    $recruiter = null;
    foreach ($companyDefs as $i => [$name, $sec, $c, $size, $color, $desc]) {
        $slug = slugify($name);
        $uid = $i === 0
            ? $mkUser('company', 'recruteur@tremplin.ga', 'Marc', 'Obiang', '+241 66 12 34 56', 'FREE', 150)
            : $mkUser('company', "rh@$slug.ga", ['Sandrine', 'Patrick', 'Nadège', 'Hervé', 'Linda', 'Joël', 'Prisca', 'Rodrigue', 'Carine', 'Yannick', 'Murielle'][$i - 1], 'RH', null, 'FREE', 160 - $i * 7);
        if ($i === 0) {
            $recruiter = $uid;
        }
        $cid = DB::insert('companies', [
            'name' => $name, 'slug' => $slug, 'sector_id' => $S($sec), 'city_id' => $city[$c], 'size' => $size, 'website' => "https://www.$slug.ga",
            'email' => "contact@$slug.ga", 'phone' => '+241 11 ' . mt_rand(10, 99) . ' ' . mt_rand(10, 99) . ' ' . mt_rand(10, 99),
            'rccm' => 'GA-LBV-' . (2015 + $i) . '-B-' . mt_rand(10000, 99999), 'description' => $desc, 'color' => $color,
            'status' => $i === 11 ? 'pending' : 'verified', 'verified_at' => $i === 11 ? null : $ago(140 - $i * 5),
            'job_credits' => 10, 'plan_code' => $i < 3 ? 'BIZ_PRO' : 'BIZ_FREE', 'created_at' => $ago(160 - $i * 7),
        ]);
        DB::insert('company_users', ['company_id' => $cid, 'user_id' => $uid, 'role' => 'owner']);
        $companies[$name] = ['id' => $cid, 'user' => $uid, 'sector' => $S($sec), 'city' => $c];
    }

    /* ---------- Offres ---------- */
        $jobDefs = [
        // [entreprise, titre, type, ville, remote, edu, exp, salMin, salMax, compétences [nom=>[req,poids]], soft, langues, durée, résumé]
        ['OkoumeTech', 'Stagiaire Développeur·se Web PHP / Laravel', 'stage', 'Libreville', 1, 4, 0, 100000, 150000, ['PHP' => [1, 5], 'SQL' => [1, 4], 'JavaScript' => [0, 3], 'Git' => [0, 2], 'HTML / CSS' => [1, 3]], 'Travail en équipe,Autonomie,Rigueur', 'Français:C1,Anglais:A2', '6 mois', 'Rejoins l\'équipe produit pour développer des plateformes web utilisées par des milliers de Gabonais.'],
        ['OkoumeTech', 'Développeur·se Mobile Flutter junior', 'premier_emploi', 'Libreville', 1, 4, 6, 350000, 500000, ['Développement mobile' => [1, 5], 'JavaScript' => [0, 2], 'Git' => [1, 3], 'SQL' => [0, 2]], 'Autonomie,Créativité,Résolution de problèmes', 'Français:C1,Anglais:B1', null, 'Développe des applications mobiles de paiement et de services publics.'],
        ['OkoumeTech', 'Stage UX/UI Designer', 'stage', 'Libreville', 2, 3, 0, 80000, 120000, ['Création graphique' => [1, 5], 'HTML / CSS' => [0, 2]], 'Créativité,Communication,Travail en équipe', 'Français:C1', '4 mois', 'Conçois des interfaces simples et accessibles pour nos utilisateurs mobiles.'],
        ['OkoumeTech', 'Data Analyst junior', 'cdd', 'Libreville', 1, 5, 6, 450000, 650000, ['Analyse de données' => [1, 5], 'SQL' => [1, 4], 'Power BI' => [1, 3], 'Python' => [0, 3], 'Excel avancé' => [0, 2]], 'Rigueur,Résolution de problèmes,Communication', 'Français:C1,Anglais:B1', '12 mois', 'Transforme nos données clients en tableaux de bord et décisions.'],
        ['Banque de l\'Estuaire', 'Stage Assistant·e Comptable', 'stage', 'Libreville', 0, 3, 0, 75000, 100000, ['Comptabilité générale' => [1, 5], 'Excel avancé' => [1, 3], 'Sage Comptabilité' => [0, 3], 'Fiscalité' => [0, 2]], 'Rigueur,Sens de l\'organisation', 'Français:C1', '3 mois', 'Participe aux travaux comptables mensuels de la direction financière.'],
        ['Banque de l\'Estuaire', 'Conseiller·ère clientèle — Programme Jeunes Talents', 'premier_emploi', 'Libreville', 0, 4, 0, 400000, 550000, ['Gestion de la relation client' => [1, 5], 'Techniques de vente' => [1, 4], 'Pack Office' => [0, 2]], 'Communication,Travail en équipe,Adaptabilité', 'Français:C1,Anglais:A2', null, 'Programme de 18 mois pour devenir conseiller·ère bancaire, formation incluse.'],
        ['Banque de l\'Estuaire', 'Analyste Crédit PME', 'cdi', 'Libreville', 0, 6, 24, 800000, 1100000, ['Analyse financière' => [1, 5], 'Comptabilité générale' => [1, 3], 'Excel avancé' => [1, 3], 'Droit des affaires' => [0, 2]], 'Rigueur,Résolution de problèmes', 'Français:C1,Anglais:B1', null, 'Évalue les dossiers de financement des PME gabonaises.', 1],
        ['Banque de l\'Estuaire', 'Alternance Contrôle de gestion', 'alternance', 'Libreville', 0, 4, 0, 150000, 200000, ['Contrôle de gestion' => [1, 5], 'Excel avancé' => [1, 4], 'Power BI' => [0, 3]], 'Rigueur,Autonomie', 'Français:C1', '24 mois', 'Alternance en Master CCA / contrôle de gestion avec notre direction financière.'],
        ['Ogooué Énergies Services', 'Technicien·ne HSE junior', 'premier_emploi', 'Port-Gentil', 0, 3, 6, 450000, 600000, ['HSE' => [1, 5], 'Pack Office' => [0, 2]], 'Rigueur,Communication,Gestion du stress', 'Français:C1,Anglais:B2', null, 'Accompagne nos équipes terrain sur les sites onshore et offshore.'],
        ['Ogooué Énergies Services', 'Stage Électrotechnicien·ne', 'stage', 'Port-Gentil', 0, 3, 0, 100000, 150000, ['Électricité industrielle' => [1, 5], 'Maintenance industrielle' => [1, 4], 'HSE' => [0, 2]], 'Travail en équipe,Rigueur', 'Français:B2,Anglais:A2', '6 mois', 'Interventions de maintenance électrique sur installations industrielles.'],
        ['Ogooué Énergies Services', 'Technicien·ne installation solaire', 'cdd', 'Franceville', 0, 3, 12, 350000, 450000, ['Énergie solaire' => [1, 5], 'Électricité industrielle' => [1, 4]], 'Autonomie,Adaptabilité', 'Français:B2', '12 mois', 'Électrification solaire de villages et de centres de santé dans le Haut-Ogooué.'],
        ['Ogooué Énergies Services', 'Géologue junior — exploration', 'cdi', 'Moanda', 0, 6, 12, 900000, 1300000, ['Géologie' => [1, 5], 'SIG / Cartographie' => [1, 3], 'Analyse de données' => [0, 2]], 'Rigueur,Adaptabilité,Travail en équipe', 'Français:C1,Anglais:B2', null, 'Campagnes d\'exploration minière dans la province du Haut-Ogooué.', 1],
        ['Akanda Logistique', 'Stage Assistant·e Logistique', 'stage', 'Owendo', 0, 3, 0, 75000, 100000, ['Logistique' => [1, 5], 'Gestion des stocks' => [1, 4], 'Excel avancé' => [0, 3]], 'Sens de l\'organisation,Rigueur', 'Français:C1', '4 mois', 'Suivi des flux entrants et sortants de notre entrepôt d\'Owendo.'],
        ['Akanda Logistique', 'Déclarant·e en douane junior', 'premier_emploi', 'Owendo', 0, 3, 0, 300000, 400000, ['Transit & douane' => [1, 5], 'Logistique' => [0, 3], 'Pack Office' => [0, 2]], 'Rigueur,Gestion du stress', 'Français:C1,Anglais:A2', null, 'Préparation des déclarations et suivi des dossiers de transit.'],
        ['Akanda Logistique', 'Chef·fe de quai — CDI', 'cdi', 'Owendo', 0, 3, 24, 450000, 550000, ['Logistique' => [1, 4], 'Gestion des stocks' => [1, 4], 'Gestion de projet' => [0, 2]], 'Leadership,Gestion du stress,Sens de l\'organisation', 'Français:C1', null, 'Encadre une équipe de 15 manutentionnaires et pilote les opérations de quai.'],
        ['Komo Telecom', 'Stage Technicien·ne Réseaux & Fibre', 'stage', 'Libreville', 0, 3, 0, 100000, 150000, ['Réseaux informatiques' => [1, 5], 'Support informatique' => [0, 3]], 'Travail en équipe,Adaptabilité', 'Français:C1,Anglais:A2', '6 mois', 'Déploiement et maintenance du réseau fibre à Libreville et Akanda.'],
        ['Komo Telecom', 'Community Manager', 'cdd', 'Libreville', 1, 3, 6, 300000, 400000, ['Gestion des réseaux sociaux' => [1, 5], 'Rédaction' => [1, 4], 'Création graphique' => [0, 3], 'Marketing digital' => [0, 3]], 'Créativité,Communication,Réactivité', 'Français:C2,Anglais:B1', '12 mois', 'Anime nos communautés Facebook, Instagram et TikTok (+800 000 abonnés).'],
        ['Komo Telecom', 'Analyste Cybersécurité junior', 'cdi', 'Libreville', 1, 5, 12, 700000, 950000, ['Cybersécurité' => [1, 5], 'Réseaux informatiques' => [1, 4], 'Python' => [0, 2]], 'Rigueur,Résolution de problèmes', 'Français:C1,Anglais:B2', null, 'Surveillance et protection de notre infrastructure mobile money.'],
        ['Komo Telecom', 'Commercial·e terrain — Mobile Money', 'premier_emploi', 'Oyem', 0, 2, 0, 200000, 300000, ['Techniques de vente' => [1, 5], 'Gestion de la relation client' => [1, 3]], 'Communication,Adaptabilité,Autonomie', 'Français:C1,Fang:B2', null, 'Développe notre réseau de points de vente Mobile Money dans le Woleu-Ntem.'],
        ['Green Forest Gabon', 'Stage Ingénieur·e forestier·ère', 'stage', 'Lambaréné', 0, 5, 0, 120000, 180000, ['Gestion forestière' => [1, 5], 'SIG / Cartographie' => [1, 4]], 'Autonomie,Rigueur,Adaptabilité', 'Français:C1,Anglais:B1', '6 mois', 'Participe aux inventaires forestiers et au plan d\'aménagement certifié FSC.'],
        ['Green Forest Gabon', 'Technicien·ne SIG', 'cdd', 'Lambaréné', 1, 4, 6, 400000, 500000, ['SIG / Cartographie' => [1, 5], 'Analyse de données' => [0, 3]], 'Rigueur,Autonomie', 'Français:C1,Anglais:B1', '18 mois', 'Cartographie des concessions et suivi satellite de la déforestation.'],
        ['Santé Plus Gabon', 'Infirmier·ère diplômé·e d\'État', 'cdi', 'Libreville', 0, 3, 0, 350000, 450000, ['Soins infirmiers' => [1, 5]], 'Communication,Gestion du stress,Travail en équipe', 'Français:C1', null, 'Rejoins nos équipes de soins en médecine générale et urgences.', 1],
        ['Santé Plus Gabon', 'Stage Assistant·e en pharmacie', 'stage', 'Franceville', 0, 2, 0, 60000, 80000, ['Pharmacie' => [1, 4], 'Gestion de la relation client' => [0, 3]], 'Rigueur,Communication', 'Français:C1', '3 mois', 'Dispensation, gestion des stocks et conseil aux patients.'],
        ['Santé Plus Gabon', 'Chargé·e RH & Paie', 'cdi', 'Libreville', 0, 4, 12, 500000, 650000, ['Gestion des ressources humaines' => [1, 5], 'Excel avancé' => [1, 3], 'Droit des affaires' => [0, 2]], 'Rigueur,Communication', 'Français:C1', null, 'Gestion administrative du personnel (180 salariés) et préparation de la paie.'],
        ['Lopé Hôtels & Lodges', 'Réceptionniste bilingue', 'premier_emploi', 'Libreville', 0, 2, 0, 250000, 300000, ['Accueil & hôtellerie' => [1, 5], 'Gestion de la relation client' => [1, 3]], 'Communication,Adaptabilité', 'Français:C1,Anglais:B2', null, 'Accueil d\'une clientèle internationale d\'affaires et de touristes.'],
        ['Lopé Hôtels & Lodges', 'Stage Marketing digital & tourisme', 'stage', 'Libreville', 2, 3, 0, 70000, 100000, ['Marketing digital' => [1, 4], 'Gestion des réseaux sociaux' => [1, 4], 'Création graphique' => [0, 3]], 'Créativité,Autonomie', 'Français:C1,Anglais:B1', '4 mois', 'Fais rayonner l\'écotourisme gabonais (Lopé, Loango, Akanda) en ligne.'],
        ['Nyanga Agro', 'Agronome junior', 'premier_emploi', 'Tchibanga', 0, 5, 0, 350000, 450000, ['Agronomie' => [1, 5], 'Gestion de projet' => [0, 3]], 'Autonomie,Leadership,Adaptabilité', 'Français:C1', null, 'Pilote nos parcelles maraîchères et accompagne 60 producteurs partenaires.'],
        ['Nyanga Agro', 'Stage Commercial·e agroalimentaire', 'stage', 'Libreville', 0, 3, 0, 60000, 90000, ['Techniques de vente' => [1, 4], 'Gestion de la relation client' => [0, 3]], 'Communication,Autonomie', 'Français:C1', '3 mois', 'Développe la distribution de nos produits transformés dans les supérettes.'],
        ['Estuaire Consulting', 'Assistant·e RH (alternance)', 'alternance', 'Libreville', 1, 3, 0, 120000, 150000, ['Gestion des ressources humaines' => [1, 4], 'Pack Office' => [1, 3], 'Secrétariat' => [0, 2]], 'Sens de l\'organisation,Communication,Rigueur', 'Français:C1', '12 mois', 'Recrutement, onboarding et administration du personnel de nos clients.'],
        ['Estuaire Consulting', 'Consultant·e junior en organisation', 'cdi', 'Libreville', 1, 6, 12, 650000, 900000, ['Gestion de projet' => [1, 5], 'Analyse de données' => [0, 3], 'Excel avancé' => [1, 3], 'Rédaction' => [0, 3]], 'Communication,Résolution de problèmes,Leadership', 'Français:C2,Anglais:B2', null, 'Missions de conseil auprès d\'institutions et de PME en Afrique centrale.'],
        ['Fondation Jeunesse Active', 'Chargé·e de suivi-évaluation', 'cdd', 'Franceville', 1, 5, 12, 450000, 600000, ['Suivi-évaluation' => [1, 5], 'Analyse de données' => [1, 3], 'Excel avancé' => [0, 3]], 'Rigueur,Communication,Adaptabilité', 'Français:C1,Anglais:B2', '24 mois', 'Mesure l\'impact de nos programmes d\'insertion auprès de 2 000 jeunes.'],
        ['Fondation Jeunesse Active', 'Stage Animateur·rice de formation', 'stage', 'Franceville', 0, 3, 0, 60000, 80000, ['Enseignement' => [1, 4], 'Communication' => [0, 3]], 'Communication,Leadership,Créativité', 'Français:C1', '4 mois', 'Anime des ateliers d\'employabilité dans les lycées du Haut-Ogooué.'],
        ['OkoumeTech', 'Stage Support informatique', 'stage', 'Akanda', 0, 3, 0, 75000, 100000, ['Support informatique' => [1, 5], 'Réseaux informatiques' => [0, 3], 'Pack Office' => [0, 2]], 'Communication,Résolution de problèmes', 'Français:C1', '3 mois', 'Assistance aux utilisateurs et maintenance du parc informatique de nos clients.'],
        ['Akanda Logistique', 'Mission freelance — Tableaux de bord Power BI', 'freelance', 'Libreville', 2, 4, 6, 400000, 600000, ['Power BI' => [1, 5], 'Excel avancé' => [1, 3], 'SQL' => [0, 3]], 'Autonomie,Rigueur', 'Français:C1', '2 mois', 'Création de tableaux de bord de suivi des opérations portuaires.'],
        ['Banque de l\'Estuaire', 'Chargé·e de communication digitale', 'cdi', 'Douala', 1, 4, 12, 600000, 800000, ['Marketing digital' => [1, 4], 'Rédaction' => [1, 4], 'Gestion des réseaux sociaux' => [0, 3]], 'Créativité,Communication', 'Français:C2,Anglais:B2', null, 'Pilote la communication digitale de notre filiale camerounaise.'],
        ['Komo Telecom', 'Développeur·se Back-end PHP', 'cdi', 'Libreville', 1, 5, 18, 800000, 1200000, ['PHP' => [1, 5], 'SQL' => [1, 4], 'Git' => [1, 3], 'Cybersécurité' => [0, 2]], 'Rigueur,Travail en équipe,Autonomie', 'Français:C1,Anglais:B1', null, 'Fais évoluer la plateforme mobile money utilisée par 1 million de clients.'],
    ];
    $jobs = [];
    foreach ($jobDefs as $i => $d) {
        [$co, $title, $type, $c, $remote, $edu, $exp, $smin, $smax, $skills, $soft, $langs, $dur, $summary] = $d;
        $elim = $d[14] ?? 0;
        $company = $companies[$co];
        $days = mt_rand(1, 40);
        $status = $co === 'Mbadi Distribution' ? 'pending' : 'published';
        $start = date('Y-m-d', strtotime('+' . mt_rand(10, 60) . ' days'));
        $skillNames = array_keys($skills);
        $jid = DB::insert('jobs', [
            'company_id' => $company['id'], 'title' => $title, 'slug' => slugify($title), 'type' => $type, 'sector_id' => $company['sector'],
            'city_id' => $city[$c], 'remote' => $remote, 'summary' => $summary,
            'description' => "$summary\n\n" . $co . " recrute " . ($type === 'stage' ? 'un·e stagiaire motivé·e' : ($type === 'alternance' ? 'un·e alternant·e motivé·e' : 'un nouveau talent')) . " pour renforcer ses équipes à $c. Tu évolueras dans un environnement bienveillant, avec un tuteur dédié et de vraies responsabilités dès les premières semaines.",
            'missions' => "- Contribuer aux activités quotidiennes de l'équipe\n- Mettre en œuvre tes compétences en " . implode(', ', array_slice($skillNames, 0, 2)) . "\n- Proposer des améliorations et documenter ton travail\n- Rendre compte régulièrement à ton responsable",
            'profile' => "- Niveau " . education_levels()[$edu] . " minimum\n- " . ($exp ? 'Première expérience de ' . MatchingEngine::monthsLabel($exp) . ' appréciée' : 'Débutant·e accepté·e') . "\n- Qualités : " . str_replace(',', ', ', mb_strtolower($soft)),
            'education_min' => $edu, 'education_eliminatory' => $elim, 'experience_min' => $exp, 'salary_min' => $smin, 'salary_max' => $smax,
            'languages' => $langs, 'soft_skills' => $soft, 'duration' => $dur, 'start_date' => $start,
            'deadline' => date('Y-m-d', strtotime('+' . mt_rand(15, 60) . ' days')), 'positions' => mt_rand(1, 3),
            'apply_mode' => $i === 33 ? 'external' : 'internal', 'external_url' => $i === 33 ? 'https://www.akanda-logistique.ga/carrieres' : null,
            'status' => $status, 'featured' => in_array($i, [0, 5, 8, 16, 21], true) ? 1 : 0,
            'views' => mt_rand(40, 900), 'created_by' => $company['user'], 'published_at' => $status === 'published' ? $ago($days) : null,
            'created_at' => $ago($days + 1), 'updated_at' => $ago($days),
        ]);
        foreach ($skills as $sn => [$req, $w]) {
            DB::insert('job_skills', ['job_id' => $jid, 'skill_id' => $skill[$sn], 'required' => $req, 'weight' => $w]);
        }
        $jobs[] = $jid;
    }
    // Offre en attente de modération (entreprise non vérifiée)
    $pend = DB::insert('jobs', [
        'company_id' => $companies['Mbadi Distribution']['id'], 'title' => 'Stage Chef·fe de rayon', 'slug' => 'stage-chef-fe-de-rayon', 'type' => 'stage',
        'sector_id' => $companies['Mbadi Distribution']['sector'], 'city_id' => $city['Libreville'], 'remote' => 0,
        'summary' => 'Gestion d\'un rayon en supermarché.', 'description' => 'Gestion d\'un rayon : réassort, merchandising et relation client.',
        'missions' => "- Réassort\n- Merchandising", 'profile' => '- Bac minimum', 'education_min' => 2, 'experience_min' => 0,
        'salary_min' => 60000, 'salary_max' => 80000, 'languages' => 'Français:B2', 'soft_skills' => 'Rigueur', 'duration' => '3 mois',
        'start_date' => date('Y-m-d', strtotime('+20 days')), 'deadline' => date('Y-m-d', strtotime('+30 days')), 'status' => 'pending',
        'created_by' => $companies['Mbadi Distribution']['user'], 'created_at' => $ago(1), 'updated_at' => $ago(1),
    ]);
    DB::insert('job_skills', ['job_id' => $pend, 'skill_id' => $skill['Gestion des stocks'], 'required' => 1, 'weight' => 4]);

    /* ---------- École ---------- */
    $schoolUser = $mkUser('school', 'ecole@tremplin.ga', 'Béatrice', 'Mintsa', '+241 74 55 66 77', 'FREE', 170);
    $schoolId = DB::insert('schools', [
        'owner_user_id' => $schoolUser, 'name' => 'Institut Supérieur du Numérique et de Gestion de Libreville', 'short_name' => 'ISNG',
        'type' => 'grande_ecole', 'city_id' => $city['Libreville'], 'join_code' => 'ISNG2026', 'plan_code' => 'SCHOOL', 'created_at' => $ago(170),
    ]);
    foreach (['OkoumeTech', 'Banque de l\'Estuaire', 'Komo Telecom', 'Estuaire Consulting'] as $p) {
        DB::insert('school_partners', ['school_id' => $schoolId, 'company_id' => $companies[$p]['id'], 'created_at' => $ago(100)]);
    }

    /* ---------- Candidats ---------- */
    $cands = [
        // [email, prénom, nom, ville, titre, edu, domaine, mois exp, métier visé, secteur, types, compétences [nom=>niveau], soft, langues, riasec, plan, école?, programme]
        ['candidat@tremplin.ga', 'Grâce', 'Moussavou', 'Libreville', 'Étudiante en Licence Informatique — développement web', 4, 'Informatique de gestion', 4, 'Développeuse web', 'Numérique', 'stage,premier_emploi', ['PHP' => 3, 'HTML / CSS' => 4, 'JavaScript' => 3, 'SQL' => 3, 'Git' => 2, 'Pack Office' => 4, 'Excel avancé' => 3], 'Travail en équipe,Rigueur,Autonomie,Créativité', [['name' => 'Français', 'level' => 'C2'], ['name' => 'Anglais', 'level' => 'B1'], ['name' => 'Punu', 'level' => 'B2']], 'ICR', 'FREE', true, 'Licence Informatique'],
        ['jordan.nze@mail.ga', 'Jordan', 'Nzé', 'Libreville', 'Diplômé en Master Finance — analyse crédit', 6, 'Finance d\'entreprise', 10, 'Analyste financier', 'Banque', 'cdi,premier_emploi', ['Analyse financière' => 4, 'Comptabilité générale' => 4, 'Excel avancé' => 5, 'Power BI' => 3, 'Droit des affaires' => 2], 'Rigueur,Résolution de problèmes,Leadership', [['name' => 'Français', 'level' => 'C2'], ['name' => 'Anglais', 'level' => 'B2']], 'CIE', 'FREE', true, 'Master Finance'],
        ['merveille.ondo@mail.ga', 'Merveille', 'Ondo', 'Port-Gentil', 'Technicienne HSE — BTS QHSE', 3, 'Qualité Hygiène Sécurité Environnement', 8, 'Technicienne HSE', 'Pétrole', 'premier_emploi,cdd', ['HSE' => 4, 'Pack Office' => 3, 'Gestion de projet' => 2], 'Rigueur,Communication,Gestion du stress', [['name' => 'Français', 'level' => 'C2'], ['name' => 'Anglais', 'level' => 'B2']], 'RCS', 'FREE', false, null],
        ['kevin.mba@mail.ga', 'Kévin', 'Mba', 'Libreville', 'Développeur mobile autodidacte (Flutter)', 3, 'Réseaux et télécoms', 14, 'Développeur mobile', 'Numérique', 'premier_emploi,freelance,cdi', ['Développement mobile' => 4, 'JavaScript' => 3, 'Git' => 4, 'SQL' => 2, 'Réseaux informatiques' => 3], 'Autonomie,Créativité,Résolution de problèmes', [['name' => 'Français', 'level' => 'C2'], ['name' => 'Anglais', 'level' => 'B1']], 'IRA', 'FREE', true, 'BTS Réseaux'],
        ['ruth.ngoua@mail.ga', 'Ruth', 'Ngoua', 'Libreville', 'Community manager & créatrice de contenu', 4, 'Communication', 12, 'Community manager', 'Marketing', 'cdd,premier_emploi,freelance', ['Gestion des réseaux sociaux' => 5, 'Rédaction' => 4, 'Création graphique' => 4, 'Marketing digital' => 3], 'Créativité,Communication,Adaptabilité', [['name' => 'Français', 'level' => 'C2'], ['name' => 'Anglais', 'level' => 'B1']], 'AES', 'FREE', true, 'Licence Communication'],
        ['ismael.obame@mail.ga', 'Ismaël', 'Obame', 'Owendo', 'Assistant logistique — Licence Transport', 4, 'Transport et logistique', 6, 'Logisticien', 'Logistique', 'stage,premier_emploi', ['Logistique' => 4, 'Gestion des stocks' => 3, 'Excel avancé' => 3, 'Transit & douane' => 2], 'Sens de l\'organisation,Rigueur,Travail en équipe', [['name' => 'Français', 'level' => 'C2']], 'CER', 'FREE', false, null],
        ['christelle.mbou@mail.ga', 'Christelle', 'Mboumba', 'Franceville', 'Infirmière diplômée d\'État', 3, 'Sciences infirmières', 18, 'Infirmière', 'Santé', 'cdi,cdd', ['Soins infirmiers' => 5, 'Pack Office' => 2], 'Communication,Gestion du stress,Travail en équipe', [['name' => 'Français', 'level' => 'C2'], ['name' => 'Téké', 'level' => 'C1']], 'SRI', 'FREE', false, null],
        ['arnaud.essono@mail.ga', 'Arnaud', 'Essono', 'Oyem', 'Commercial terrain — Bac+2 Action commerciale', 3, 'Action commerciale', 8, 'Commercial', 'Commerce', 'premier_emploi,cdi', ['Techniques de vente' => 4, 'Gestion de la relation client' => 4, 'Pack Office' => 3], 'Communication,Adaptabilité,Autonomie', [['name' => 'Français', 'level' => 'C2'], ['name' => 'Fang', 'level' => 'C2']], 'ESR', 'FREE', false, null],
        ['laetitia.bivigou@mail.ga', 'Laëtitia', 'Bivigou', 'Libreville', 'Étudiante Master Comptabilité Contrôle Audit', 5, 'Comptabilité', 3, 'Contrôleuse de gestion', 'Banque', 'alternance,stage', ['Comptabilité générale' => 4, 'Contrôle de gestion' => 3, 'Excel avancé' => 4, 'Sage Comptabilité' => 3, 'Fiscalité' => 3], 'Rigueur,Sens de l\'organisation,Autonomie', [['name' => 'Français', 'level' => 'C2'], ['name' => 'Anglais', 'level' => 'B1']], 'CIS', 'FREE', true, 'Master CCA'],
        ['brice.nguema@mail.ga', 'Brice', 'Nguema', 'Lambaréné', 'Ingénieur des Eaux et Forêts (en fin d\'études)', 5, 'Foresterie', 4, 'Ingénieur forestier', 'Bois', 'stage,premier_emploi', ['Gestion forestière' => 4, 'SIG / Cartographie' => 4, 'Analyse de données' => 2], 'Autonomie,Rigueur,Adaptabilité', [['name' => 'Français', 'level' => 'C2'], ['name' => 'Anglais', 'level' => 'B2']], 'RIC', 'FREE', false, null],
        ['sarah.ella@mail.ga', 'Sarah', 'Ella', 'Libreville', 'Data analyst junior — Python & Power BI', 6, 'Statistiques et data science', 9, 'Data analyst', 'Numérique', 'cdd,cdi', ['Analyse de données' => 4, 'Python' => 4, 'SQL' => 4, 'Power BI' => 4, 'Excel avancé' => 4], 'Rigueur,Résolution de problèmes,Communication', [['name' => 'Français', 'level' => 'C2'], ['name' => 'Anglais', 'level' => 'C1']], 'ICA', 'FREE', true, 'Master Data'],
        ['dimitri.koumba@mail.ga', 'Dimitri', 'Koumba', 'Port-Gentil', 'Électrotechnicien — BTS Électrotechnique', 3, 'Électrotechnique', 5, 'Électrotechnicien', 'Pétrole', 'stage,cdd,premier_emploi', ['Électricité industrielle' => 4, 'Maintenance industrielle' => 3, 'Énergie solaire' => 2, 'HSE' => 2], 'Travail en équipe,Rigueur', [['name' => 'Français', 'level' => 'C2'], ['name' => 'Anglais', 'level' => 'A2']], 'RIC', 'FREE', false, null],
        ['patricia.mintsa@mail.ga', 'Patricia', 'Mintsa', 'Libreville', 'Assistante RH en reconversion', 4, 'Gestion des ressources humaines', 20, 'Chargée RH', 'Administration', 'cdi,alternance', ['Gestion des ressources humaines' => 4, 'Secrétariat' => 4, 'Pack Office' => 5, 'Droit des affaires' => 2], 'Sens de l\'organisation,Communication,Rigueur', [['name' => 'Français', 'level' => 'C2'], ['name' => 'Anglais', 'level' => 'B1']], 'SEC', 'FREE', false, null],
        ['yann.assoumou@mail.ga', 'Yann', 'Assoumou', 'Akanda', 'Technicien support & réseaux', 3, 'Maintenance informatique', 7, 'Technicien réseaux', 'Numérique', 'stage,premier_emploi', ['Support informatique' => 4, 'Réseaux informatiques' => 3, 'Cybersécurité' => 2, 'Pack Office' => 3], 'Résolution de problèmes,Communication', [['name' => 'Français', 'level' => 'C2'], ['name' => 'Anglais', 'level' => 'A2']], 'RIC', 'FREE', true, 'BTS Maintenance'],
        ['oceane.boussougou@mail.ga', 'Océane', 'Boussougou', 'Tchibanga', 'Agronome — Master Agroéconomie', 6, 'Agronomie', 6, 'Agronome', 'Agriculture', 'premier_emploi,cdd', ['Agronomie' => 4, 'Gestion de projet' => 3, 'Suivi-évaluation' => 2], 'Leadership,Autonomie,Adaptabilité', [['name' => 'Français', 'level' => 'C2'], ['name' => 'Anglais', 'level' => 'B1']], 'IRS', 'FREE', false, null],
        ['steeve.mouele@mail.ga', 'Steeve', 'Mouélé', 'Libreville', 'Lycéen — Bac en poche, cherche premier stage', 2, 'Baccalauréat série G', 0, 'Assistant commercial', 'Commerce', 'stage', ['Pack Office' => 2, 'Techniques de vente' => 2], 'Communication,Adaptabilité', [['name' => 'Français', 'level' => 'C1']], null, 'FREE', false, null],
    ];
    $candIds = [];
    foreach ($cands as $i => $c) {
        [$email, $first, $last, $cty, $head, $edu, $field, $months, $want, $sec, $types, $skills, $soft, $langs, $riasec, $plan, $inSchool, $program] = $c;
        $uid = $mkUser('candidate', $email, $first, $last, '+241 0' . mt_rand(6, 7) . ' ' . mt_rand(10, 99) . ' ' . mt_rand(10, 99) . ' ' . mt_rand(10, 99), $plan, 175 - $i * 9);
        $candIds[$email] = $uid;
        $scores = null;
        if ($riasec) {
            $base = ['R' => 30, 'I' => 35, 'A' => 25, 'S' => 30, 'E' => 28, 'C' => 32];
            foreach (str_split($riasec) as $k => $l) {
                $base[$l] = [88, 74, 62][$k];
            }
            arsort($base);
            $scores = json_encode($base);
        }
        DB::insert('candidate_profiles', [
            'user_id' => $uid, 'headline' => $head,
            'bio' => "Je suis $first, " . mb_strtolower($head) . ". Passionné·e par mon domaine, je cherche une opportunité pour mettre mes compétences au service d'une organisation ambitieuse et continuer à apprendre au contact de professionnels.",
            'city_id' => $city[$cty], 'birth_date' => (2006 - $edu - mt_rand(0, 3)) . '-0' . mt_rand(1, 9) . '-1' . mt_rand(0, 9), 'education_level' => $edu,
            'field_of_study' => $field, 'experience_months' => $months, 'desired_job' => $want, 'desired_sector_id' => $S($sec), 'desired_types' => $types,
            'desired_salary' => $edu >= 5 ? 500000 : ($edu >= 3 ? 250000 : 80000), 'remote_ok' => mt_rand(0, 1), 'mobility' => ['ville', 'national', 'national', 'international'][mt_rand(0, 3)],
            'availability_date' => date('Y-m-d', strtotime('+' . mt_rand(0, 20) . ' days')), 'languages' => json_encode($langs, JSON_UNESCAPED_UNICODE),
            'certifications' => $i % 3 === 0 ? 'Attestation Google Digital Active, PIX niveau 3' : null, 'soft_skills' => $soft,
            'riasec_code' => $riasec, 'riasec_scores' => $scores, 'cv_template' => ['moderne', 'classique', 'creatif'][$i % 3],
            'linkedin' => $i < 4 ? 'https://www.linkedin.com/in/' . slugify("$first-$last") : null, 'visible_to_recruiters' => 1, 'updated_at' => $ago(2),
        ]);
        foreach ($skills as $sn => $lvl) {
            DB::insert('candidate_skills', ['user_id' => $uid, 'skill_id' => $skill[$sn], 'level' => $lvl]);
        }
        foreach (array_map('trim', explode(',', $soft)) as $sn) {
            if (isset($skill[$sn])) {
                DB::insert('candidate_skills', ['user_id' => $uid, 'skill_id' => $skill[$sn], 'level' => 4]);
            }
        }
        $endYear = (int)date('Y') - ($edu >= 5 ? 0 : 1);
        DB::insert('candidate_educations', [
            'user_id' => $uid, 'school' => $inSchool ? 'Institut Supérieur du Numérique et de Gestion de Libreville' : ['Université Omar Bongo', 'Université des Sciences et Techniques de Masuku', 'Institut Universitaire des Sciences de l\'Organisation', 'École Nationale des Eaux et Forêts'][$i % 4],
            'degree' => education_levels()[$edu], 'field' => $field, 'start_year' => $endYear - 3, 'end_year' => $endYear,
            'description' => 'Projet de fin d\'études mené en équipe, mention Bien.',
        ]);
        DB::insert('candidate_educations', ['user_id' => $uid, 'school' => 'Lycée ' . ['Léon Mba', 'National Paul Indjendjet Gondjout', 'd\'Application Nelson Mandela', 'Technique Omar Bongo'][$i % 4], 'degree' => 'Baccalauréat', 'field' => 'Série ' . ['C', 'D', 'G2', 'F3'][$i % 4], 'start_year' => $endYear - 6, 'end_year' => $endYear - 3, 'description' => null]);
        if ($months > 0) {
            $sk = array_keys($skills);
            DB::insert('candidate_experiences', [
                'user_id' => $uid, 'title' => 'Stagiaire ' . mb_strtolower($want), 'company' => ['Cabinet Mbeng & Associés', 'PME Numérique Akanda', 'Société Gabonaise de Services', 'Coopérative du Komo'][$i % 4],
                'kind' => 'stage', 'city' => $cty, 'start_date' => date('Y-m-d', strtotime("-" . ($months + 6) . " months")), 'end_date' => date('Y-m-d', strtotime('-6 months')),
                'description' => 'Missions en ' . implode(', ', array_slice($sk, 0, 2)) . '. J\'ai participé à l\'amélioration des processus internes et obtenu une évaluation très positive de mon tuteur.',
            ]);
            DB::insert('candidate_experiences', [
                'user_id' => $uid, 'title' => 'Projet : ' . ['Application de gestion des notes', 'Étude de marché locale', 'Campagne de sensibilisation', 'Tableau de bord des ventes'][$i % 4],
                'company' => 'Projet académique', 'kind' => 'projet', 'city' => $cty, 'start_date' => date('Y-m-d', strtotime('-4 months')), 'end_date' => date('Y-m-d', strtotime('-2 months')),
                'description' => 'Conception et réalisation en équipe de 4 personnes. J\'ai organisé le planning et livré le projet dans les délais : résultat présenté devant un jury de professionnels.',
            ]);
        }
        if ($inSchool) {
            DB::insert('school_students', ['school_id' => $schoolId, 'user_id' => $uid, 'program' => $program, 'level' => $edu >= 5 ? 'M2' : ($edu === 4 ? 'L3' : 'BTS 2'), 'cohort' => date('Y'), 'graduated' => $edu >= 6 ? 1 : 0, 'employed' => $i === 1 ? 1 : 0, 'joined_at' => $ago(90)]);
        }
        if ($riasec) {
            DB::insert('riasec_results', ['user_id' => $uid, 'scores' => $scores, 'code' => $riasec, 'created_at' => $ago(30)]);
        }
    }
    $demo = $candIds['candidat@tremplin.ga'];
    // CV de démonstration : photo (illustration), centres d'intérêt et une expérience avec quelques fautes courantes
    // pour montrer la relecture obligatoire avant le téléchargement du PDF.
    DB::insert('candidate_experiences', [
        'user_id' => $demo, 'title' => 'vendeuse caissière (emploi d\'été)', 'company' => 'Supermarché Mbolo', 'kind' => 'emploi', 'city' => 'Libreville',
        'start_date' => date('Y-m-d', strtotime('-26 months')), 'end_date' => date('Y-m-d', strtotime('-23 months')),
        'description' => "Accueil des clients et tenue de la caisse.\nJ'ai participer à l'organisation des évenements du magasin,et au suivi des stocks.\nFormation des nouveaux saisonniers  aux procédures d'encaissement.",
    ]);
    DB::update('candidate_profiles', ['interests' => 'Bénévolat associatif, basket-ball, photographie', 'cv_template' => 'moderne'], 'user_id = :u', ['u' => $demo]);
    $photo = __DIR__ . '/demo/photo-demo.jpg';
    if (is_file($photo) && function_exists('imagecreatetruecolor')) {
        $tmp = tempnam(sys_get_temp_dir(), 'cv');
        copy($photo, $tmp);
        try {
            \App\Services\Cv\CvPhoto::store($demo, ['name' => 'photo.jpg', 'tmp_name' => $tmp, 'size' => filesize($tmp), 'error' => UPLOAD_ERR_OK]);
        } catch (\Throwable) {
            @unlink($tmp);
        }
    }

    /* ---------- Candidatures ---------- */
    $statusFlow = ['sent', 'viewed', 'shortlisted', 'interview', 'accepted', 'rejected'];
    $applyPairs = [
        // candidat => [indices d'offres, statut final]
        'candidat@tremplin.ga' => [[0, 'interview'], [2, 'viewed'], [32, 'sent'], [35, 'rejected'], [1, 'shortlisted']],
        'kevin.mba@mail.ga' => [[1, 'interview'], [0, 'shortlisted'], [15, 'sent']],
        'sarah.ella@mail.ga' => [[3, 'shortlisted'], [29, 'viewed']],
        'jordan.nze@mail.ga' => [[6, 'interview'], [7, 'viewed']],
        'laetitia.bivigou@mail.ga' => [[7, 'shortlisted'], [4, 'accepted']],
        'ruth.ngoua@mail.ga' => [[16, 'interview'], [25, 'sent'], [2, 'sent']],
        'merveille.ondo@mail.ga' => [[8, 'shortlisted']],
        'dimitri.koumba@mail.ga' => [[9, 'viewed'], [10, 'sent']],
        'ismael.obame@mail.ga' => [[12, 'interview'], [13, 'sent']],
        'yann.assoumou@mail.ga' => [[15, 'shortlisted'], [32, 'sent'], [0, 'sent']],
        'christelle.mbou@mail.ga' => [[21, 'accepted']],
        'arnaud.essono@mail.ga' => [[18, 'viewed']],
        'brice.nguema@mail.ga' => [[19, 'interview']],
        'patricia.mintsa@mail.ga' => [[23, 'shortlisted'], [28, 'sent']],
        'oceane.boussougou@mail.ga' => [[26, 'viewed']],
        'steeve.mouele@mail.ga' => [[27, 'sent'], [0, 'rejected']],
    ];
    foreach ($applyPairs as $email => $list) {
        $uid = $candIds[$email];
        $p = ProfileService::load($uid, true);
        foreach ($list as [$jIdx, $final]) {
            $jid = $jobs[$jIdx];
            $job = MatchingEngine::loadJob($jid);
            if ($job['apply_mode'] !== 'internal') {
                continue;
            }
            $m = MatchingEngine::compute($p, $job);
            $days = mt_rand(3, 25);
            $aid = DB::insert('applications', [
                'job_id' => $jid, 'user_id' => $uid, 'status' => $final,
                'cover_letter' => "Madame, Monsieur,\n\nVotre offre « {$job['title']} » correspond exactement à mon projet professionnel. " . $p['bio'] . "\n\nJe serais ravi·e d'échanger avec vous.\n\n{$p['first_name']} {$p['last_name']}",
                'match_score' => $m['score'], 'match_details' => json_encode($m['criteria'], JSON_UNESCAPED_UNICODE),
                'rating' => in_array($final, ['shortlisted', 'interview', 'accepted'], true) ? mt_rand(3, 5) : null,
                'recruiter_notes' => $final === 'interview' ? 'Profil très motivé, bonne présentation. À confirmer en entretien technique.' : null,
                'created_at' => $ago($days), 'updated_at' => $ago(max(0, $days - 3)),
            ]);
            $reached = $final === 'rejected' ? ['sent', 'viewed', 'rejected'] : array_slice($statusFlow, 0, array_search($final, $statusFlow, true) + 1);
            foreach ($reached as $k => $st) {
                DB::insert('application_events', ['application_id' => $aid, 'status' => $st, 'note' => null, 'actor_id' => $st === 'sent' ? $uid : $job['created_by'], 'created_at' => $ago(max(0, $days - $k * 2))]);
            }
            if ($final === 'interview') {
                DB::insert('interviews', ['application_id' => $aid, 'scheduled_at' => date('Y-m-d 10:00:00', strtotime('+' . mt_rand(2, 8) . ' days')), 'mode' => $email === 'candidat@tremplin.ga' ? 'presentiel' : 'visio', 'location' => $email === 'candidat@tremplin.ga' ? 'Siège OkoumeTech, Boulevard Triomphal, Libreville' : 'Lien Google Meet envoyé par e-mail', 'note' => 'Prévoir 45 minutes. Apporter une copie du CV.', 'created_at' => $ago(2)]);
                DB::insert('messages', ['application_id' => $aid, 'sender_id' => $job['created_by'], 'body' => "Bonjour {$p['first_name']}, ton profil nous intéresse beaucoup ! Nous t'avons programmé un entretien. À très vite.", 'created_at' => $ago(2)]);
            }
        }
    }

    /* ---------- Favoris, versions de CV, lettres, entretiens ---------- */
    foreach ([3, 16, 5] as $j) {
        DB::insert('favorites', ['user_id' => $demo, 'job_id' => $jobs[$j], 'created_at' => $ago(4)]);
    }
    DB::insert('cv_versions', ['user_id' => $demo, 'label' => 'CV Stage développement web', 'template' => 'moderne', 'snapshot' => json_encode(ProfileService::load($demo, true), JSON_UNESCAPED_UNICODE), 'created_at' => $ago(12)]);
    DB::insert('interview_sessions', ['user_id' => $demo, 'job_id' => $jobs[0], 'questions' => json_encode([['type' => 'Présentation', 'q' => 'Présente-toi en deux minutes.']]), 'answers' => json_encode(['Je suis Grâce, étudiante en Licence informatique. Lors de mon stage, j\'ai développé un module de gestion en PHP qui a permis de réduire de 30 % le temps de saisie.']), 'feedback' => json_encode([['score' => 8, 'good' => ['Contexte posé', 'Tu parles de tes actions personnelles (« j\'ai… »)', 'Résultat mis en avant', 'Réponse chiffrée'], 'tips' => ['Développe davantage (vise 60 à 180 mots, soit 1 à 2 minutes à l\'oral).'], 'words' => 32]], JSON_UNESCAPED_UNICODE), 'score' => 80, 'created_at' => $ago(6)]);

    /* ---------- Stages suivis par l'école ---------- */
    $internStatus = ['candidature', 'en_cours', 'placement', 'convention', 'recherche', 'termine', 'candidature', 'en_cours'];
    $k = 0;
    foreach (DB::all('SELECT user_id FROM school_students WHERE school_id = :s', ['s' => $schoolId]) as $st) {
        $status = $internStatus[$k++ % count($internStatus)];
        DB::insert('internships', [
            'school_id' => $schoolId, 'user_id' => $st['user_id'],
            'company_name' => in_array($status, ['recherche', 'candidature'], true) ? null : ['OkoumeTech', 'Banque de l\'Estuaire', 'Komo Telecom', 'Estuaire Consulting'][$k % 4],
            'status' => $status, 'start_date' => in_array($status, ['en_cours', 'termine', 'convention'], true) ? date('Y-m-d', strtotime('-' . mt_rand(10, 80) . ' days')) : null,
            'end_date' => in_array($status, ['en_cours', 'termine', 'convention'], true) ? date('Y-m-d', strtotime('+' . mt_rand(-10, 90) . ' days')) : null,
            'tutor' => in_array($status, ['en_cours', 'termine', 'convention'], true) ? 'M. Ndoutoume' : null,
            'agreement_signed' => in_array($status, ['convention', 'en_cours', 'termine'], true) ? 1 : 0, 'updated_at' => $ago(mt_rand(1, 20)),
        ]);
    }

    /* ---------- Notifications ---------- */
    $notifs = [
        [$demo, 'interview', 'Entretien programmé avec OkoumeTech', 'Ton entretien pour « Stagiaire Développeur·se Web PHP / Laravel » est confirmé.', '/espace/candidatures', 1],
        [$demo, 'job_match', 'Nouvelle offre compatible à 82 % : Data Analyst junior', 'OkoumeTech · Libreville — Très bon match', '/offres/' . $jobs[3], 2],
        [$demo, 'status', 'Ta candidature a été consultée', 'Stage UX/UI Designer — OkoumeTech', '/espace/candidatures', 3],
        [$demo, 'tip', 'Astuce : complète ton profil pour gagner des points', 'Ajouter une certification augmente ton score de compatibilité.', '/espace/profil', 5],
        [$recruiter, 'application', 'Nouvelle candidature très compatible (85 %)', 'Kévin Mba a postulé à « Développeur·se Mobile Flutter junior ».', '/entreprise/offres/' . $jobs[1] . '/candidatures', 1],
        [$recruiter, 'application', '3 nouveaux candidats pour votre stage PHP', 'Consultez les profils classés par compatibilité.', '/entreprise/offres/' . $jobs[0] . '/candidatures', 3],
        [$schoolUser, 'internship', 'Convention de stage signée', 'Un de vos étudiants a signé sa convention avec Komo Telecom.', '/ecole/stages', 2],
        [$admin, 'moderation', 'Nouvelle entreprise à vérifier', 'Mbadi Distribution attend la vérification de son RCCM.', '/admin/entreprises', 1],
    ];
    foreach ($notifs as [$u, $type, $title, $body, $link, $d]) {
        DB::insert('notifications', ['user_id' => $u, 'type' => $type, 'title' => $title, 'body' => $body, 'link' => $link, 'created_at' => $ago($d), 'read_at' => $d > 3 ? $ago($d - 1) : null]);
    }

    /* ---------- Plan de progression de la candidate de démo ---------- */
    foreach ([['certification', 'Microsoft Power BI Data Analyst (PL-300)', 'skill:12', 'en_cours', 4], ['certification', 'TOEIC Listening & Reading', 'lang:anglais', 'todo', 2]] as [$kind, $name, $key, $st, $d]) {
        DB::insert('candidate_goals', ['user_id' => $demo, 'kind' => $kind, 'ref_id' => DB::value('SELECT id FROM certifications WHERE name = :n', ['n' => $name]), 'label' => $name, 'gap_key' => $key, 'status' => $st, 'created_at' => $ago($d), 'done_at' => null]);
    }

    /* ---------- Formations en ligne suivies et certificats (démonstration) ---------- */
    $tid = fn(string $title) => (int)DB::value('SELECT id FROM trainings WHERE title = :t', ['t' => $title]);
    foreach ([['Réalisez des dashboards avec Power BI', 'en_cours', 6, null], ['Initiez-vous à la gestion de projet agile', 'suivie', 2, null], ['Gérez du code avec Git et GitHub', 'terminee', 40, 25]] as [$title, $st, $start, $end]) {
        if ($id = $tid($title)) {
            DB::insert('candidate_trainings', ['user_id' => $demo, 'training_id' => $id, 'status' => $st, 'started_at' => $st === 'suivie' ? null : $ago($start), 'completed_at' => $end ? $ago($end) : null, 'created_at' => $ago($start)]);
            DB::run('UPDATE trainings SET clicks = clicks + :c WHERE id = :id', ['c' => 3 + $start % 7, 'id' => $id]);
        }
    }
    if ($git = $tid('Gérez du code avec Git et GitHub')) {
        DB::insert('candidate_certificates', ['user_id' => $demo, 'training_id' => $git, 'certification_id' => null, 'title' => 'Gérez du code avec Git et GitHub', 'issuer' => 'OpenClassrooms',
            'issued_at' => date('Y-m-d', strtotime('-25 days')), 'credential_url' => null, 'credential_id' => null, 'document_id' => null, 'status' => 'verifie',
            'review_note' => 'Données de démonstration', 'created_at' => $ago(25), 'reviewed_at' => $ago(24)]);
    }
    if ($cyber = $tid('Introduction to Cybersecurity')) {
        DB::insert('candidate_certificates', ['user_id' => $candIds['steeve.mouele@mail.ga'], 'training_id' => $cyber, 'certification_id' => null, 'title' => 'Introduction to Cybersecurity', 'issuer' => 'Cisco Networking Academy',
            'issued_at' => date('Y-m-d', strtotime('-3 days')), 'credential_url' => null, 'credential_id' => null, 'document_id' => null, 'status' => 'declare',
            'review_note' => null, 'created_at' => $ago(2), 'reviewed_at' => null]);
        DB::insert('candidate_trainings', ['user_id' => $candIds['steeve.mouele@mail.ga'], 'training_id' => $cyber, 'status' => 'terminee', 'started_at' => $ago(20), 'completed_at' => $ago(3), 'created_at' => $ago(20)]);
    }

    /* ---------- Signalements & audit ---------- */
    DB::insert('reports', ['user_id' => $candIds['steeve.mouele@mail.ga'], 'entity' => 'job', 'entity_id' => $jobs[18], 'subject' => 'Demande de frais de dossier', 'reason' => 'Une personne se présentant comme recruteur m\'a demandé 10 000 FCFA par Mobile Money pour « valider » ma candidature.', 'status' => 'open', 'created_at' => $ago(1)]);
    foreach ([['company.verified', 'company', 1], ['job.approved', 'job', 3], ['user.login', null, null], ['matching.weights_updated', 'sector', null]] as $k => [$a, $e, $id]) {
        DB::insert('audit_logs', ['user_id' => $admin, 'action' => $a, 'entity' => $e, 'entity_id' => $id, 'meta' => null, 'ip' => '127.0.0.1', 'created_at' => $ago(10 - $k * 2)]);
    }

    $pdo->commit();

    // Scores d'employabilité et complétion
    foreach ($candIds as $uid) {
        ProfileService::refreshCompletion($uid);
    }
    // Historique de progression du candidat démo
    $cur = (int)DB::value('SELECT employability_score FROM candidate_profiles WHERE user_id = :u', ['u' => $demo]);
    DB::delete('employability_scores', 'user_id = :u', ['u' => $demo]);
    foreach ([42, 51, 58, 63, $cur] as $k => $sc) {
        DB::insert('employability_scores', ['user_id' => $demo, 'score' => min($sc, $cur), 'details' => null, 'created_at' => $ago((4 - $k) * 12)]);
    }
};
