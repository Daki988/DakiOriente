<?php
/* =========================================================
   Atelier NEAM — Production des livrables par l'IA (API Claude)
   L'IA rédige à partir du brief du client uniquement ; chaque livrable
   passe ensuite par le contrôle qualité automatique puis par la validation
   d'un expert NEAM avant d'être livré.
   Appel HTTP direct (pas de Composer sur l'hébergement mutualisé).
   ========================================================= */
declare(strict_types=1);

require_once __DIR__ . '/core.php';
require_once __DIR__ . '/../audit/http.php';

function ia_cle(): string
{
    global $CONFIG;
    return (string) (atelier_cfg('anthropic_api_key', '') ?: ($CONFIG['audit']['anthropic_api_key'] ?? '') ?: (atelier_acces()['cle'] ?? ''));
}

const IA_REGLES = <<<TXT
Tu es l’équipe de production de NEAM Softwares Industry, agence de transformation digitale à Libreville (Gabon). Tu rédiges les livrables des clients de NEAM : petites entreprises, TPE et PME gabonaises.

Règles de production, à respecter dans chaque livrable :
- Français clair et naturel, adapté au Gabon (FCFA, Airtel Money et Moov Money, quartiers de Libreville quand le brief les cite). Phrases courtes, pas de jargon, pas d’emoji sauf si le livrable l’exige (publications de réseaux sociaux : 0 à 2 emoji).
- Tu t’appuies uniquement sur le brief du client. N’invente jamais de prix, de chiffre, d’adresse, de numéro, d’horaire, de produit, de récompense, d’ancienneté, de nombre de clients, d’avis ou de témoignage. Si une information manque, écris un texte qui s’en passe ; ne laisse jamais de texte à trou entre crochets.
- Aucune promesse de résultat garanti, aucun superlatif invérifiable (« le meilleur de Libreville », « n° 1 »).
- Le ton est celui demandé dans le brief ; à défaut, chaleureux, professionnel et direct. On vouvoie les clients de l’entreprise, sauf si le brief demande le tutoiement.
- Les textes doivent pouvoir être publiés tels quels après relecture : orthographe soignée, espaces avant « : ; ? ! » comme en français.
TXT;

/** Définition de chaque générateur : consigne + schéma JSON de sortie. */
function ia_generateurs(): array
{
    $s = fn(array $props) => ['type' => 'object', 'properties' => $props, 'required' => array_keys($props), 'additionalProperties' => false];
    $str = ['type' => 'string'];
    $liste = ['type' => 'array', 'items' => $str];
    $qr = ['type' => 'array', 'items' => $s(['question' => $str, 'reponse' => $str])];
    return [
        'diagnostic' => [
            'consigne' => "Établis le diagnostic digital de cette entreprise à partir du brief (et du résultat NEAM Digital Score s’il est fourni). synthese : 3 à 4 phrases sur où en est l’entreprise. forces et faiblesses : 3 à 5 points chacune, concrets. priorites : exactement 3 actions classées, avec pourquoi et l’impact attendu, sans chiffre inventé. pack_recommande : l’offre NEAM la plus adaptée (starter = micro-entreprise qui veut être trouvée ; business = TPE qui a besoin d’un site et d’outils commerciaux ; growth = PME qui veut automatiser et acquérir des clients ; enterprise = organisation qui a besoin d’un logiciel métier ; custom = besoin hors cadre). justification : 2 phrases. questions_a_poser : 3 à 5 questions à poser au client pendant l’entretien de diagnostic pour compléter le brief.",
            'schema' => $s(['synthese' => $str, 'forces' => $liste, 'faiblesses' => $liste,
                'priorites' => ['type' => 'array', 'items' => $s(['action' => $str, 'pourquoi' => $str, 'impact' => $str])],
                'pack_recommande' => ['type' => 'string', 'enum' => array_keys(ATELIER_PACKS)], 'justification' => $str, 'questions_a_poser' => $liste]),
        ],
        'fiche_google' => [
            'consigne' => "Rédige le contenu de la fiche Google Business Profile. description : 600 à 750 caractères au maximum, avec l’activité, la ville et le quartier s’ils sont connus, ce qui distingue l’entreprise, sans lien ni numéro. categorie_principale et categories_secondaires (2 à 4) : intitulés de catégories Google en français. services : 4 à 8 services ou produits du brief, avec une description de 1 à 2 phrases. posts : 4 publications Google (titre court, texte de 2 à 4 phrases, bouton). reponses_avis : 2 modèles de réponse à un avis positif et 2 à un avis négatif (excuse, solution, invitation à reprendre contact, sans se justifier longuement). questions_reponses : 4 à 6 questions fréquentes avec réponses, tirées du brief.",
            'schema' => $s(['description' => $str, 'categorie_principale' => $str, 'categories_secondaires' => $liste,
                'services' => ['type' => 'array', 'items' => $s(['nom' => $str, 'description' => $str])],
                'posts' => ['type' => 'array', 'items' => $s(['titre' => $str, 'texte' => $str, 'bouton' => ['type' => 'string', 'enum' => ['Appeler', 'En savoir plus', 'Commander', 'Réserver', 'Acheter']]])],
                'reponses_avis' => $s(['positif' => $liste, 'negatif' => $liste]), 'questions_reponses' => $qr]),
        ],
        'page' => [
            'consigne' => "Rédige la page de présentation (une seule page web) de l’entreprise. titre_seo : 65 caractères au maximum, avec l’activité et la ville. meta_description : 150 caractères au maximum. accroche : une phrase forte (8 à 12 mots). sous_titre : 1 à 2 phrases. a_propos : un paragraphe de 3 à 5 phrases. services : 3 à 6 blocs (titre, texte de 1 à 2 phrases) tirés du brief. points_forts : 3 raisons de choisir l’entreprise, tirées du brief. faq : 3 à 5 questions et réponses. appel_action : texte court du bouton WhatsApp (5 mots au maximum). message_whatsapp : le message prérempli que le visiteur envoie en cliquant (1 phrase).",
            'schema' => $s(['titre_seo' => $str, 'meta_description' => $str, 'accroche' => $str, 'sous_titre' => $str, 'a_propos' => $str,
                'services' => ['type' => 'array', 'items' => $s(['titre' => $str, 'texte' => $str])],
                'points_forts' => ['type' => 'array', 'items' => $s(['titre' => $str, 'texte' => $str])],
                'faq' => $qr, 'appel_action' => $str, 'message_whatsapp' => $str]),
        ],
        'whatsapp' => [
            'consigne' => "Prépare la configuration WhatsApp Business. profil_description : 2 phrases (512 caractères au maximum). message_accueil : envoyé au premier message d’un client. message_absence : envoyé en dehors des horaires du brief. reponses_rapides : 8 à 12 réponses rapides (raccourci commençant par « / », un mot, et texte prêt à envoyer) qui couvrent les questions fréquentes du brief : horaires, localisation, prix (si le brief les donne, sinon inviter à préciser le besoin), livraison, paiement, commande. catalogue : une description courte et vendeuse pour chaque produit ou service du brief.",
            'schema' => $s(['profil_description' => $str, 'message_accueil' => $str, 'message_absence' => $str,
                'reponses_rapides' => ['type' => 'array', 'items' => $s(['raccourci' => $str, 'texte' => $str])],
                'catalogue' => ['type' => 'array', 'items' => $s(['produit' => $str, 'description' => $str])]]),
        ],
        'sequences' => [
            'consigne' => "Rédige les messages des relances automatiques de l’entreprise. Prévois ces séquences : relance d’un devis resté sans réponse, relance d’une facture impayée (ferme mais courtoise), confirmation de commande ou de rendez-vous, rappel la veille d’un rendez-vous, demande d’avis Google après un achat. Pour chaque séquence : nom, declencheur (l’événement qui la lance), et 1 à 3 messages avec le moment d’envoi (ex. « J+2 »), le canal et le texte. Utilise {prenom}, {montant}, {date}, {heure}, {lien_avis} comme variables remplies automatiquement par l’outil d’envoi : ce sont les seules accolades autorisées.",
            'schema' => $s(['sequences' => ['type' => 'array', 'items' => $s(['nom' => $str, 'declencheur' => $str,
                'messages' => ['type' => 'array', 'items' => $s(['quand' => $str, 'canal' => ['type' => 'string', 'enum' => ['WhatsApp', 'E-mail', 'SMS']], 'texte' => $str])]])]]),
        ],
        'calendrier' => [
            'consigne' => "Prépare le calendrier éditorial du mois indiqué : exactement le nombre de publications demandé, réparties sur les 4 semaines et sur les réseaux du client. Varie les thèmes : produits ou services, coulisses, conseils utiles à la clientèle, questions fréquentes, appel à l’action (WhatsApp, visite). Tiens compte des moments du mois au Gabon s’ils sont pertinents (fêtes, rentrée, fin de mois). Pour chaque publication : semaine (1 à 4), jour conseillé, reseau, format (photo, carrousel, vidéo courte, story), theme, texte prêt à publier, visuel (ce qu’il faut photographier ou créer, en une phrase), hashtags (3 à 6, dont la ville).",
            'schema' => $s(['publications' => ['type' => 'array', 'items' => $s(['semaine' => ['type' => 'integer'], 'jour' => $str, 'reseau' => $str, 'format' => $str, 'theme' => $str, 'texte' => $str, 'visuel' => $str, 'hashtags' => $liste])]]),
        ],
        'rapport' => [
            'consigne' => "Rédige le rapport mensuel du client à partir des mesures fournies (mois en cours et, s’il existe, mois précédent). Utilise uniquement ces chiffres : n’en calcule pas d’autres que des écarts simples, n’en invente aucun. resume : 2 à 3 phrases. faits_marquants : 3 à 5 points. lecture : ce que ces chiffres veulent dire pour l’entreprise, en 3 à 4 phrases, sans jargon. actions : 3 actions pour le mois prochain avec pourquoi. message_client : un message WhatsApp de 3 à 5 lignes qui accompagne l’envoi du rapport au dirigeant.",
            'schema' => $s(['resume' => $str, 'faits_marquants' => $liste, 'lecture' => $str,
                'actions' => ['type' => 'array', 'items' => $s(['action' => $str, 'pourquoi' => $str])], 'message_client' => $str]),
        ],
    ];
}

/** Brief tel que l'IA le reçoit : seulement les champs remplis. */
function ia_brief(array $c): array
{
    $b = [];
    foreach (ATELIER_BRIEF as $k => [$label]) {
        $v = trim((string) ($c['brief'][$k] ?? ''));
        if ($v !== '') {
            $b[$label] = $v;
        }
    }
    $p = ATELIER_PACKS[$c['pack']];
    $b['Offre NEAM souscrite'] = $p['nom'] . ' : ' . implode(' ; ', $p['contenu']);
    return $b;
}

/**
 * Génère un livrable. $extra : données propres au générateur (mois, mesures, Digital Score…).
 * @return array{ok: bool, data?: array, erreur?: string}
 */
function ia_generer(string $type, array $c, array $extra = []): array
{
    $gens = ia_generateurs();
    if (!isset($gens[$type])) {
        return ['ok' => false, 'erreur' => 'Livrable inconnu.'];
    }
    $cle = ia_cle();
    if ($cle === '') {
        return ['ok' => false, 'erreur' => 'Aucune clé Claude : ajoutez-la dans Réglages (menu du haut).'];
    }
    @set_time_limit(180);
    $prompt = "<brief_client>\n" . json_encode(ia_brief($c), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n</brief_client>\n\n";
    if ($extra) {
        $prompt .= "<donnees>\n" . json_encode($extra, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n</donnees>\n\n";
    }
    $prompt .= $gens[$type]['consigne'];

    $res = api_json('POST', (string) atelier_cfg('api_url', 'https://api.anthropic.com/v1/messages'), [
        'x-api-key: ' . $cle,
        'anthropic-version: 2023-06-01',
        'anthropic-beta: server-side-fallback-2026-07-01',
    ], [
        'model' => (string) atelier_cfg('model', 'claude-opus-5-5'),
        'max_tokens' => 16000,
        'fallbacks' => 'default',
        'output_config' => [
            'effort' => (string) atelier_cfg('effort', 'medium'),
            'format' => ['type' => 'json_schema', 'schema' => $gens[$type]['schema']],
        ],
        'system' => [['type' => 'text', 'text' => IA_REGLES, 'cache_control' => ['type' => 'ephemeral']]],
        'messages' => [['role' => 'user', 'content' => $prompt]],
    ], 170);

    $stop = $res['data']['stop_reason'] ?? '';
    if ($res['status'] !== 200 || !$res['data'] || $stop === 'refusal' || $stop === 'max_tokens') {
        $detail = $res['data']['error']['message'] ?? ($stop ?: $res['error']);
        error_log('NEAM atelier IA: HTTP ' . $res['status'] . ' ' . substr((string) $detail, 0, 300));
        return ['ok' => false, 'erreur' => 'La génération a échoué (' . ($res['status'] ?: 'réseau') . ($detail ? ' : ' . mb_substr((string) $detail, 0, 160) : '') . '). Réessayez dans un instant.'];
    }
    $text = '';
    foreach ($res['data']['content'] ?? [] as $block) {
        if (($block['type'] ?? '') === 'text') {
            $text .= $block['text'];
        }
    }
    $data = json_decode($text, true);
    if (!is_array($data)) {
        return ['ok' => false, 'erreur' => 'Réponse illisible. Réessayez.'];
    }
    return ['ok' => true, 'data' => $data];
}
