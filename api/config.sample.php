<?php
/* =========================================================
   NEAM — Réglages d'envoi des formulaires (MODÈLE)
   Vos vrais réglages (mot de passe, clés) vont dans config.php, qui n'est jamais remplacé
   par une mise à jour du site. S'il n'existe pas encore, copiez ce fichier sous le nom config.php.
   ========================================================= */
return [
    // Adresse d'expédition (doit exister chez LWS)
    'from_email' => 'contact@neamindustry.com',
    'from_name'  => 'NEAM Softwares Industry',

    // Destinataires des messages du formulaire de contact
    'contact_to' => ['contact@neamindustry.com'],

    // Destinataires des rapports de candidature au programme 30/30
    'candidature_to' => ['daki.liaison@gmail.com'],

    // Envoi par SMTP (recommandé pour éviter les spams).
    // Laissez 'password' vide pour utiliser l'envoi intégré de l'hébergement.
    // Les paramètres exacts se trouvent dans le panneau LWS, rubrique « E-mails ».
    'smtp' => [
        'host'     => 'mail.neamindustry.com',
        'port'     => 465,
        'secure'   => 'ssl',          // 'ssl' pour le port 465, 'tls' pour le port 587
        'username' => 'contact@neamindustry.com',
        'password' => '',
    ],

    // Sites autorisés à utiliser les formulaires
    'allowed_hosts' => ['www.neamindustry.com', 'neamindustry.com'],

    // Outil NEAM Digital Score™ (digital-score.html)
    // Toutes les clés sont facultatives : sans clé, l'audit du site web fonctionne quand même.
    'audit' => [
        // Destinataires des nouveaux audits (prospects)
        'notify_to' => ['daki.liaison@gmail.com'],
        // Google Places API (New) : fiche Google Business, avis, concurrents automatiques
        'google_places_key' => '',
        'places_daily_cap'  => 300,   // plafond d'appels par jour (protège la facturation)
        // Google PageSpeed Insights : score de performance mobile
        'pagespeed_key' => '',
        // API Claude (Anthropic) : synthèse rédigée par l'AI Analyst
        'anthropic_api_key' => '',
        'anthropic_model'   => 'claude-opus-5-5',
    ],

    // Assistant du site (chatbot, js/chat.js → api/chat.php)
    // Sans clé, il répond avec des réponses préparées. Avec une clé Claude (la même que
    // pour le Digital Score suffit), il rédige ses réponses à partir de la présentation de NEAM.
    'chat' => [
        'ai'                => true,              // false : réponses préparées uniquement
        'anthropic_api_key' => '',                // vide : utilise audit → anthropic_api_key
        'model'             => 'claude-opus-5-5',
        'rate_limit'        => 30,                // messages par adresse IP sur 10 minutes
    ],

    // Atelier NEAM (www.neamindustry.com/atelier/) : back-office de production réservé à l'équipe.
    // Rien à remplir : à la première visite, un code est envoyé par e-mail et vous choisissez votre mot de passe.
    'atelier' => [
        'password'          => '',
        'anthropic_api_key' => '',                // vide : utilise audit → anthropic_api_key
        'model'             => 'claude-opus-5-5',
        'effort'            => 'medium',          // qualité de rédaction des livrables
    ],

    // Limite anti-abus : nombre d'envois par adresse IP sur 10 minutes
    'rate_limit' => 5,

    // Plafonds journaliers GLOBAUX par type d'opération (toutes IP confondues).
    // Protègent la facturation Google / Anthropic et la bande passante contre un abus
    // distribué (quelqu'un qui change d'adresse IP pour contourner la limite par IP).
    // Mettez une valeur à 0 pour désactiver un plafond. Relevez-les si le trafic légitime augmente.
    'daily_caps' => [
        'discover' => 400,   // diagnostics lancés par jour
        'site'     => 1500,  // sites analysés par jour
        'chat'     => 1000,  // messages de l'assistant IA par jour
        'mail'     => 400,   // rapports envoyés par jour
    ],

    // Défense en profondeur (facultatif) : dossier de stockage des audits et prospects.
    // Laissez vide pour utiliser api/data (déjà protégé par .htaccess). Pour une sécurité maximale,
    // indiquez un chemin ABSOLU situé HORS de la racine web (hors public_html), par exemple
    // '/home/VOTRECOMPTE/neam-data' : même si .htaccess était ignoré, les coordonnées resteraient inaccessibles.
    'data_dir' => '',
];
