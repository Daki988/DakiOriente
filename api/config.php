<?php
/* =========================================================
   NEAM — Réglages d'envoi des formulaires
   Seul ce fichier est à modifier.
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

    // Limite anti-abus : nombre d'envois par adresse IP sur 10 minutes
    'rate_limit' => 5,
];
