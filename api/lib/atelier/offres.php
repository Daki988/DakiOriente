<?php
/* =========================================================
   Atelier NEAM — Offres, tarifs et calcul du retour sur investissement
   Source unique des prix : les propositions commerciales et les
   tableaux de bord de l'Atelier sont calculés à partir de ce fichier.
   Montants en FCFA hors taxes.
   ========================================================= */
declare(strict_types=1);

const ATELIER_ETAPES = [
    'contact' => 'Premier contact',
    'diagnostic' => 'Diagnostic',
    'proposition' => 'Proposition',
    'mise_en_place' => 'Mise en place',
    'en_ligne' => 'Mise en ligne',
    'suivi' => 'Suivi mensuel',
    'perdu' => 'Sans suite',
];

/** Livrables que l'Atelier sait produire, dans l'ordre du parcours. */
const ATELIER_LIVRABLES = [
    'diagnostic' => ['Diagnostic', 'Synthèse, forces, faiblesses et 3 priorités'],
    'fiche_google' => ['Fiche Google Business', 'Description, catégories, services, posts, réponses aux avis'],
    'page' => ['Page de présentation', 'Textes et page web prête à publier'],
    'whatsapp' => ['WhatsApp Business', 'Accueil, absence, réponses rapides, catalogue'],
    'sequences' => ['Relances automatiques', 'Messages de relance des devis, des impayés, confirmations, demandes d’avis'],
    'calendrier' => ['Calendrier du mois', 'Publications prêtes à programmer'],
    'rapport' => ['Rapport mensuel', 'Résultats du mois et actions suivantes'],
];

/**
 * Packs. roi : hypothèses par défaut du client type (remplacées par les chiffres du client).
 *  - debut_temps / debut_ventes : mois à partir duquel le temps gagné / les ventes en plus comptent
 *  - abo_debut : mois du premier abonnement facturé
 */
const ATELIER_PACKS = [
    'starter' => [
        'nom' => 'NEAM Starter', 'cible' => 'Micro-entreprises',
        'diagnostic' => 0, 'mise_en_place' => 0, 'mensuel' => 90000, 'engagement' => 6, 'a_partir_de' => false,
        'contenu' => ['Diagnostic digital', 'Fiche Google Business gérée (mises à jour, réponses aux avis)', 'Page de présentation avec bouton WhatsApp, domaine et hébergement', 'WhatsApp Business configuré (catalogue, réponses rapides)', '8 publications par mois sur 1 réseau social', 'Rapport mensuel des résultats'],
        'livrables' => ['diagnostic', 'fiche_google', 'page', 'whatsapp', 'calendrier', 'rapport'],
        'publications' => 8, 'reseaux' => 1,
        'roi' => ['unite' => 'ventes', 'heures_mois' => 20, 'valeur_heure' => 2500, 'debut_temps' => 3, 'debut_ventes' => 3, 'abo_debut' => 1, 'prudent' => 15, 'cible' => 30],
    ],
    'business' => [
        'nom' => 'NEAM Business', 'cible' => 'TPE',
        'diagnostic' => 0, 'mise_en_place' => 450000, 'mensuel' => 120000, 'engagement' => 12, 'a_partir_de' => false,
        'contenu' => ['Site vitrine de 5 à 8 pages', 'Fiche Google Business', 'Identité numérique (charte réseaux)', 'Modèles de devis et de factures', 'Relance automatique des devis sans réponse', 'Chaque mois : référencement local, 2 réseaux à 12 publications, maintenance, rapport et un point d’1 h'],
        'livrables' => ['diagnostic', 'fiche_google', 'page', 'whatsapp', 'sequences', 'calendrier', 'rapport'],
        'publications' => 12, 'reseaux' => 2,
        'roi' => ['unite' => 'clients', 'heures_mois' => 32, 'valeur_heure' => 5000, 'debut_temps' => 2, 'debut_ventes' => 4, 'abo_debut' => 1, 'prudent' => 3, 'cible' => 6],
    ],
    'growth' => [
        'nom' => 'NEAM Growth', 'cible' => 'PME',
        'diagnostic' => 150000, 'mise_en_place' => 1500000, 'mensuel' => 220000, 'engagement' => 12, 'a_partir_de' => false,
        'contenu' => ['CRM paramétré (fiches clients, suivi des devis)', '3 automatisations : relance des devis, relance des impayés, confirmations WhatsApp', 'Tableau de bord des ventes', 'Une journée de formation', 'Chaque mois : acquisition de clients (budget publicitaire en plus), référencement, maintenance, 2 demi-journées d’accompagnement'],
        'livrables' => ['diagnostic', 'fiche_google', 'page', 'whatsapp', 'sequences', 'calendrier', 'rapport'],
        'publications' => 12, 'reseaux' => 2,
        'roi' => ['unite' => 'clients', 'heures_mois' => 60, 'valeur_heure' => 6000, 'debut_temps' => 3, 'debut_ventes' => 4, 'abo_debut' => 1, 'prudent' => 3, 'cible' => 6],
    ],
    'enterprise' => [
        'nom' => 'NEAM Enterprise', 'cible' => 'Organisations de 10 à 50 utilisateurs',
        'diagnostic' => 300000, 'mise_en_place' => 3500000, 'mensuel' => 300000, 'engagement' => 12, 'a_partir_de' => true,
        'contenu' => ['Logiciel métier livré par lots toutes les 2 à 3 semaines', 'Reprise des données et formation des référents', 'Chaque mois : hébergement, assistance, 2 jours d’évolutions'],
        'livrables' => ['diagnostic', 'sequences', 'rapport'],
        'publications' => 0, 'reseaux' => 0,
        'roi' => ['unite' => 'heures', 'agents' => 20, 'valeur_heure' => 6000, 'debut_temps' => 5, 'debut_ventes' => 99, 'abo_debut' => 4, 'prudent' => 2, 'cible' => 3],
    ],
    'custom' => [
        'nom' => 'NEAM Custom', 'cible' => 'Besoins spécifiques',
        'diagnostic' => 0, 'mise_en_place' => 0, 'mensuel' => 0, 'engagement' => 12, 'a_partir_de' => true,
        'contenu' => ['Cadrage à 120 000 FCFA la journée de consultant', 'Architecture et solution conçues sur mesure, sur devis'],
        'livrables' => ['diagnostic', 'rapport'],
        'publications' => 0, 'reseaux' => 0,
        'roi' => ['unite' => 'clients', 'heures_mois' => 0, 'valeur_heure' => 5000, 'debut_temps' => 3, 'debut_ventes' => 4, 'abo_debut' => 1, 'prudent' => 3, 'cible' => 6],
    ],
];

/** Services vendus à l'unité (options d'une proposition). Prix retenu = milieu de fourchette. */
const ATELIER_SERVICES = [
    'fiche' => ['Fiche Google Business', 35000, 'unique'],
    'page' => ['Page de présentation', 120000, 'unique'],
    'vitrine' => ['Site vitrine 5 à 8 pages', 425000, 'unique'],
    'boutique' => ['Boutique en ligne avec Mobile Money', 1125000, 'unique'],
    'seo' => ['Référencement local', 60000, 'mensuel'],
    'reseaux' => ['Gestion réseaux sociaux (2 réseaux, 12 publications)', 90000, 'mensuel'],
    'maintenance' => ['Hébergement, sécurité, maintenance', 20000, 'mensuel'],
    'cadrage' => ['Cadrage logiciel', 200000, 'unique'],
    'outil' => ['Outil devis, factures, stock', 900000, 'unique'],
    'crm' => ['CRM ou ERP sur mesure', 3400000, 'unique'],
    'workflow' => ['Workflow automatisé', 200000, 'unique'],
    'assistant' => ['Assistant IA de réponse', 600000, 'unique'],
    'assistant_suivi' => ['Suivi de l’assistant IA', 40000, 'mensuel'],
    'dashboard' => ['Tableau de bord des ventes', 325000, 'unique'],
    'formation' => ['Formation (demi-journée, 10 personnes)', 150000, 'unique'],
    'accompagnement' => ['Accompagnement mensuel', 150000, 'mensuel'],
    'consultant' => ['Journée de consultant', 120000, 'unique'],
];

const ATELIER_REMISE_24_MOIS = 0.10;

function fcfa(float $n): string
{
    return number_format(round($n), 0, ',', "\u{202F}") . "\u{00A0}FCFA";
}

/** Mensualité après remise d'engagement. */
function atelier_mensuel(array $pack, int $engagement): float
{
    return $pack['mensuel'] * ($engagement >= 24 ? 1 - ATELIER_REMISE_24_MOIS : 1);
}

/** Lignes du devis : mise en place, abonnement, options choisies. */
function atelier_devis(string $packKey, int $engagement, array $options = []): array
{
    $p = ATELIER_PACKS[$packKey];
    $mensuel = atelier_mensuel($p, $engagement);
    $lignes = [];
    if ($p['diagnostic'] > 0) {
        $lignes[] = ['Diagnostic approfondi (déduit de la mise en place si signature sous 30 jours)', $p['diagnostic'], 'unique', true];
    }
    if ($p['mise_en_place'] > 0) {
        $lignes[] = ['Mise en place ' . $p['nom'] . ($p['a_partir_de'] ? ' (à partir de)' : ''), $p['mise_en_place'], 'unique', false];
    }
    if ($mensuel > 0) {
        $lignes[] = ['Abonnement ' . $p['nom'] . ($engagement >= 24 ? ' (remise 24 mois : −10 %)' : ''), $mensuel, 'mensuel', false];
    }
    foreach ($options as $k) {
        if (isset(ATELIER_SERVICES[$k])) {
            [$nom, $prix, $type] = ATELIER_SERVICES[$k];
            $lignes[] = [$nom, $prix, $type, false];
        }
    }
    $unique = array_sum(array_map(fn($l) => $l[2] === 'unique' && !$l[3] ? $l[1] : 0, $lignes));
    $mens = array_sum(array_map(fn($l) => $l[2] === 'mensuel' ? $l[1] : 0, $lignes));
    return ['lignes' => $lignes, 'unique' => $unique, 'mensuel' => $mens, 'engagement' => $engagement, 'total_engagement' => $unique + $mens * $engagement];
}

/**
 * ROI sur 12 mois (année 1) et l'année suivante, pour un nombre de ventes (ou d'heures) en plus.
 * $h : hypothèses fusionnées (pack + chiffres du client).
 */
function atelier_roi_scenario(array $h, array $devis, float $n): array
{
    $an1Cout = $an1Gain = 0.0;
    for ($m = 1; $m <= 12; $m++) {
        $an1Cout += ($m === 1 ? $devis['unique'] : 0) + ($m >= $h['abo_debut'] ? $devis['mensuel'] : 0);
        $an1Gain += atelier_gain_mois($h, $n, $m);
    }
    $an2Cout = $devis['mensuel'] * 12;
    $an2Gain = 12 * atelier_gain_mois($h, $n, 99);
    return [
        'n' => $n,
        'gain_mensuel' => atelier_gain_mois($h, $n, 99),
        'an1_cout' => $an1Cout, 'an1_gain' => $an1Gain, 'an1_roi' => $an1Cout > 0 ? ($an1Gain - $an1Cout) / $an1Cout : null,
        'an2_cout' => $an2Cout, 'an2_gain' => $an2Gain, 'an2_roi' => $an2Cout > 0 ? ($an2Gain - $an2Cout) / $an2Cout : null,
    ];
}

function atelier_gain_mois(array $h, float $n, int $m): float
{
    if ($h['unite'] === 'heures') {   // n = heures gagnées par agent et par semaine
        return $m >= $h['debut_temps'] ? $n * 4 * $h['agents'] * $h['valeur_heure'] : 0;
    }
    $temps = $m >= $h['debut_temps'] ? $h['heures_mois'] * $h['valeur_heure'] : 0;
    $ventes = $m >= $h['debut_ventes'] ? $n * $h['marge_unitaire'] : 0;
    return $temps + $ventes;
}

/** Hypothèses du pack, remplacées par les chiffres connus du client. */
function atelier_hypotheses(string $packKey, array $brief, array $saisie = []): array
{
    $h = ATELIER_PACKS[$packKey]['roi'];
    $panier = (float) ($saisie['panier'] ?? $brief['panier'] ?? 0);
    $marge = (float) ($saisie['marge'] ?? $brief['marge'] ?? 0);
    $h['panier'] = $panier;
    $h['marge'] = $marge;
    $h['marge_unitaire'] = $panier > 0 && $marge > 0 ? $panier * $marge / 100 : 0;
    foreach (['heures_mois', 'valeur_heure', 'prudent', 'cible', 'agents'] as $k) {
        if (isset($saisie[$k]) && $saisie[$k] !== '' && is_numeric($saisie[$k])) {
            $h[$k] = (float) $saisie[$k];
        }
    }
    return $h;
}

/** Tableau complet : point mort, prudent, cible. Null si les chiffres du client manquent. */
function atelier_roi(string $packKey, array $devis, array $h): ?array
{
    if ($h['unite'] !== 'heures' && $h['marge_unitaire'] <= 0) {
        return null;
    }
    $base = atelier_roi_scenario($h, $devis, 0);
    $parUnite = atelier_roi_scenario($h, $devis, 1)['an1_gain'] - $base['an1_gain'];
    $pm = $parUnite > 0 ? max(0, ($base['an1_cout'] - $base['an1_gain']) / $parUnite) : 0;
    return [
        'hypotheses' => $h,
        'point_mort' => atelier_roi_scenario($h, $devis, $pm),
        'prudent' => atelier_roi_scenario($h, $devis, $h['prudent']),
        'cible' => atelier_roi_scenario($h, $devis, $h['cible']),
    ];
}

function pct(?float $r): string
{
    if ($r === null) {
        return '–';
    }
    $v = (int) round($r * 100);
    return ($v > 0 ? '+' : ($v < 0 ? "\u{2212}" : '')) . abs($v) . "\u{00A0}%";
}
