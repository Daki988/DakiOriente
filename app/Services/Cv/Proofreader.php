<?php
declare(strict_types=1);

namespace App\Services\Cv;

use App\Core\DB;
use App\Services\Ai\AiService;

/**
 * Relecture du CV avant téléchargement : orthographe, grammaire, typographie et majuscules.
 * - Moteur NEAM (règles + dictionnaire des fautes fréquentes), toujours disponible ;
 * - Claude, quand il est configuré, pour l'orthographe et la grammaire en contexte.
 * Chaque erreur doit être corrigée (un clic) ou volontairement conservée avant de télécharger le PDF.
 */
final class Proofreader
{
    public const TYPES = [
        'orthographe' => 'Orthographe', 'grammaire' => 'Grammaire', 'conjugaison' => 'Conjugaison', 'accord' => 'Accord',
        'typographie' => 'Typographie', 'majuscule' => 'Majuscule', 'ponctuation' => 'Ponctuation', 'style' => 'Conseil de rédaction',
    ];

    /** Fautes fréquentes, jamais correctes telles quelles en français. */
    private const DICT = [
        'acceuil' => 'accueil', 'acceuillir' => 'accueillir', 'acceuilli' => 'accueilli', 'acceuillant' => 'accueillant', 'accueuil' => 'accueil',
        'developpement' => 'développement', 'dévelopement' => 'développement', 'dévellopement' => 'développement', 'developement' => 'développement',
        'developpeur' => 'développeur', 'developpeuse' => 'développeuse', 'developper' => 'développer', 'développé' => 'développé', 'devellopper' => 'développer',
        'experience' => 'expérience', 'experiences' => 'expériences', 'expèrience' => 'expérience', 'experiance' => 'expérience',
        'competence' => 'compétence', 'competences' => 'compétences', 'compétance' => 'compétence', 'compétances' => 'compétences', 'competant' => 'compétent', 'compétant' => 'compétent',
        'societe' => 'société', 'universite' => 'université', 'etudiant' => 'étudiant', 'etudiante' => 'étudiante', 'etudiants' => 'étudiants', 'etudes' => 'études', 'etude' => 'étude',
        'ecole' => 'école', 'electricite' => 'électricité', 'electrique' => 'électrique', 'electronique' => 'électronique', 'electricien' => 'électricien', 'mecanique' => 'mécanique',
        'reseau' => 'réseau', 'reseaux' => 'réseaux', 'securite' => 'sécurité', 'qualite' => 'qualité', 'responsabilite' => 'responsabilité', 'responsabilites' => 'responsabilités',
        'capacite' => 'capacité', 'capacites' => 'capacités', 'activite' => 'activité', 'activites' => 'activités', 'comptabilite' => 'comptabilité', 'rigeur' => 'rigueur', 'rigoureu' => 'rigoureux',
        'parmis' => 'parmi', 'malgres' => 'malgré', 'aujourdhui' => 'aujourd\'hui', 'professionel' => 'professionnel', 'professionelle' => 'professionnelle', 'professionels' => 'professionnels',
        'proffessionnel' => 'professionnel', 'personel' => 'personnel', 'personnelement' => 'personnellement', 'addresse' => 'adresse', 'adresse mail' => 'adresse e-mail',
        'apartement' => 'appartement', 'notament' => 'notamment', 'notammment' => 'notamment', 'interessé' => 'intéressé', 'interessée' => 'intéressée', 'interessant' => 'intéressant',
        'interessante' => 'intéressante', 'tres' => 'très', 'deja' => 'déjà', 'déja' => 'déjà', 'apres' => 'après', 'stagiare' => 'stagiaire', 'stagière' => 'stagiaire', 'stagiere' => 'stagiaire',
        'secretaire' => 'secrétaire', 'secretariat' => 'secrétariat', 'reussite' => 'réussite', 'reussi' => 'réussi', 'reussir' => 'réussir', 'equipe' => 'équipe', 'equipes' => 'équipes',
        'elaboration' => 'élaboration', 'evenement' => 'événement', 'evenements' => 'événements', 'évenement' => 'événement', 'évenements' => 'événements', 'évènements' => 'événements', 'evenementiel' => 'événementiel', 'évènementiel' => 'événementiel',
        'ameliorer' => 'améliorer', 'amelioration' => 'amélioration', 'creation' => 'création', 'creer' => 'créer', 'realisation' => 'réalisation', 'realisations' => 'réalisations',
        'realiser' => 'réaliser', 'realisé' => 'réalisé', 'repondre' => 'répondre', 'telephone' => 'téléphone', 'telephonique' => 'téléphonique', 'telecommunications' => 'télécommunications',
        'strategie' => 'stratégie', 'methode' => 'méthode', 'methodes' => 'méthodes', 'periode' => 'période', 'gerer' => 'gérer', 'gerée' => 'gérée', 'géstion' => 'gestion', 'mangement' => 'management',
        'informatiqe' => 'informatique', 'infomatique' => 'informatique', 'logitique' => 'logistique', 'marketting' => 'marketing', 'commerical' => 'commercial', 'comercial' => 'commercial',
        'comerciale' => 'commerciale', 'comptabilitée' => 'comptabilité', 'excellente' => 'excellente', 'exellent' => 'excellent', 'exellente' => 'excellente', 'excelent' => 'excellent',
        'dinamique' => 'dynamique', 'dynamiqe' => 'dynamique', 'autonnome' => 'autonome', 'autonomme' => 'autonome', 'polyvalant' => 'polyvalent', 'polyvalante' => 'polyvalente',
        'ponctuel' => 'ponctuel', 'serieux' => 'sérieux', 'sérieu' => 'sérieux', 'motivee' => 'motivée', 'curiosite' => 'curiosité', 'creativite' => 'créativité', 'disponibilite' => 'disponibilité',
        'diplome' => 'diplôme', 'diplomé' => 'diplômé', 'diplomée' => 'diplômée', 'baccalaureat' => 'baccalauréat', 'bacalauréat' => 'baccalauréat', 'baccalauriat' => 'baccalauréat',
        'licence professionelle' => 'licence professionnelle', 'master professionel' => 'master professionnel', 'anglais courrant' => 'anglais courant', 'courrament' => 'couramment',
        'language' => 'langage', 'languages' => 'langages', 'connaissance approfondie' => 'connaissance approfondie', 'maîtrise' => 'maîtrise', 'maitrîse' => 'maîtrise',
        'recrutemment' => 'recrutement', 'reccrutement' => 'recrutement', 'entrepise' => 'entreprise', 'entreprsie' => 'entreprise', 'entrprise' => 'entreprise', 'fournisseur' => 'fournisseur',
        'factuation' => 'facturation', 'facutration' => 'facturation', 'trésorie' => 'trésorerie', 'tresorerie' => 'trésorerie', 'controle' => 'contrôle', 'controles' => 'contrôles',
        'conseillé clientèle' => 'conseiller clientèle', 'clientelle' => 'clientèle', 'clientéle' => 'clientèle', 'relation clients' => 'relation client',
        'rédiger des compte rendus' => 'rédiger des comptes rendus', 'compte-rendus' => 'comptes rendus', 'comptes-rendus' => 'comptes rendus',
        'quelque soit' => 'quel que soit', 'quelque soient' => 'quels que soient', 'au jour d\'aujourd\'hui' => 'aujourd\'hui', 'pallier à' => 'pallier',
        'je suis aller' => 'je suis allé', 'j\'ai participer' => 'j\'ai participé', 'j\'ai effectuer' => 'j\'ai effectué', 'j\'ai réaliser' => 'j\'ai réalisé', 'j\'ai travailler' => 'j\'ai travaillé',
        'j\'ai assurer' => 'j\'ai assuré', 'j\'ai gérer' => 'j\'ai géré', 'j\'ai développer' => 'j\'ai développé', 'j\'ai organiser' => 'j\'ai organisé', 'j\'ai acquis des compétence' => 'j\'ai acquis des compétences',
        'a partir de' => 'à partir de', 'grace à' => 'grâce à', 'grace a' => 'grâce à', 'grâce a' => 'grâce à', 'jusqu\'a' => 'jusqu\'à', 'a l\'écoute' => 'à l\'écoute', 'face a' => 'face à',
        'a temps plein' => 'à temps plein', 'a temps partiel' => 'à temps partiel', 'a distance' => 'à distance', 'a l\'aise' => 'à l\'aise', 'apte a' => 'apte à', 'capable de travailler en equipe' => 'capable de travailler en équipe',
        'travail d\'equipe' => 'travail d\'équipe', 'travaille en équipe' => 'travail en équipe', 'esprit d\'equipe' => 'esprit d\'équipe', 'prise d\'initiatives' => 'prise d\'initiative',
        'francais' => 'français', 'française' => 'française', 'francaise' => 'française',
    ];

    /** Noms propres et outils dont la graphie est fixe. */
    private const PROPER = [
        'excel' => 'Excel', 'powerpoint' => 'PowerPoint', 'linkedin' => 'LinkedIn', 'whatsapp' => 'WhatsApp', 'facebook' => 'Facebook', 'github' => 'GitHub', 'gitlab' => 'GitLab',
        'javascript' => 'JavaScript', 'typescript' => 'TypeScript', 'sql' => 'SQL', 'html' => 'HTML', 'css' => 'CSS', 'php' => 'PHP', 'mysql' => 'MySQL', 'wordpress' => 'WordPress',
        'photoshop' => 'Photoshop', 'illustrator' => 'Illustrator', 'canva' => 'Canva', 'android' => 'Android', 'python' => 'Python', 'google' => 'Google', 'microsoft' => 'Microsoft',
        'outlook' => 'Outlook', 'autocad' => 'AutoCAD', 'power bi' => 'Power BI', 'gabon' => 'Gabon', 'libreville' => 'Libreville', 'port-gentil' => 'Port-Gentil',
        'franceville' => 'Franceville', 'oyem' => 'Oyem', 'moanda' => 'Moanda', 'lambaréné' => 'Lambaréné', 'mouila' => 'Mouila', 'tchibanga' => 'Tchibanga', 'makokou' => 'Makokou',
        'koulamoutou' => 'Koulamoutou', 'owendo' => 'Owendo', 'akanda' => 'Akanda', 'ntoum' => 'Ntoum', 'cv' => 'CV', 'pme' => 'PME', 'rh' => 'RH', 'bts' => 'BTS', 'dut' => 'DUT',
    ];

    private const FR_WORDS = ['le', 'la', 'les', 'des', 'et', 'de', 'du', 'pour', 'avec', 'dans', 'une', 'un', 'sur', 'au', 'aux', 'en', 'je', 'mon', 'ma', 'mes'];
    private const EN_WORDS = ['the', 'and', 'of', 'with', 'to', 'for', 'in', 'my', 'on', 'at', 'a', 'an', 'is', 'i'];

    /* ------------------------------------------------------------------ */

    /** Textes affichés sur le CV, adressables pour la correction. */
    public static function fields(array $p): array
    {
        $f = [];
        $add = function (string $key, string $label, ?string $text, string $kind) use (&$f) {
            if (trim((string)$text) !== '') {
                $f[$key] = ['label' => $label, 'text' => (string)$text, 'kind' => $kind];
            }
        };
        $ai = $p['cv_ai_data'] ?? null;
        $add('user.first_name', 'Prénom', $p['first_name'] ?? '', 'name');
        $add('user.last_name', 'Nom', $p['last_name'] ?? '', 'name');
        !empty($ai['headline']) ? $add('ai.headline', 'Titre (version IA)', $ai['headline'], 'title') : $add('profile.headline', 'Titre du profil', $p['headline'] ?? '', 'title');
        !empty($ai['summary']) ? $add('ai.summary', 'Accroche (version IA)', $ai['summary'], 'text') : $add('profile.bio', 'Présentation', $p['bio'] ?? '', 'text');
        foreach ($p['experiences'] ?? [] as $x) {
            $id = (int)$x['id'];
            $where = $x['title'] ?: 'Expérience';
            $add("exp.$id.title", 'Intitulé — ' . $where, $x['title'], 'title');
            $add("exp.$id.company", 'Organisation — ' . $where, $x['company'] ?? '', 'org');
            $add("exp.$id.city", 'Lieu — ' . $where, $x['city'] ?? '', 'org');
            if (!empty($ai['experiences'][$id])) {
                foreach ($ai['experiences'][$id] as $i => $b) {
                    $add("ai.exp.$id.$i", 'Puce (version IA) — ' . $where, $b, 'bullet');
                }
            } else {
                $add("exp.$id.description", 'Description — ' . $where, $x['description'] ?? '', 'text');
            }
        }
        foreach ($p['educations'] ?? [] as $e) {
            $id = (int)$e['id'];
            $add("edu.$id.degree", 'Diplôme', $e['degree'], 'title');
            $add("edu.$id.field", 'Spécialité — ' . $e['degree'], $e['field'] ?? '', 'title');
            $add("edu.$id.school", 'Établissement — ' . $e['degree'], $e['school'], 'org');
            $add("edu.$id.description", 'Détail — ' . $e['degree'], $e['description'] ?? '', 'text');
        }
        $add('profile.certifications', 'Certifications (texte libre)', $p['certifications'] ?? '', 'text');
        $add('profile.interests', 'Centres d\'intérêt', $p['interests'] ?? '', 'list');
        return $f;
    }

    public static function isEnglish(string $text): bool
    {
        $words = preg_split('/[^\p{L}]+/u', mb_strtolower($text), -1, PREG_SPLIT_NO_EMPTY);
        $fr = count(array_intersect($words, self::FR_WORDS));
        $en = count(array_intersect($words, self::EN_WORDS));
        return $en >= 3 && $en > $fr;
    }

    private static function issue(string $field, array $meta, string $original, string $suggestion, string $type, string $severity, string $message, string $source = 'NEAM'): array
    {
        return [
            'id' => substr(md5($field . '|' . $original . '|' . $suggestion), 0, 12), 'field' => $field, 'label' => $meta['label'],
            'original' => $original, 'suggestion' => $suggestion, 'type' => $type, 'severity' => $severity, 'message' => $message,
            'context' => self::context($meta['text'], $original), 'source' => $source,
        ];
    }

    private static function context(string $text, string $needle): string
    {
        $pos = $needle === '' ? false : mb_strpos($text, $needle);
        if ($pos === false) {
            return mb_substr($text, 0, 90);
        }
        $start = max(0, $pos - 35);
        $ctx = mb_substr($text, $start, mb_strlen($needle) + 70);
        return ($start > 0 ? '…' : '') . $ctx . ($start + mb_strlen($ctx) < mb_strlen($text) ? '…' : '');
    }

    private static function matchCase(string $model, string $word): string
    {
        if ($model === mb_strtoupper($model) && mb_strlen($model) > 1) {
            return mb_strtoupper($word);
        }
        if (mb_substr($model, 0, 1) === mb_strtoupper(mb_substr($model, 0, 1))) {
            return mb_strtoupper(mb_substr($word, 0, 1)) . mb_substr($word, 1);
        }
        return $word;
    }

    /** Analyse locale (moteur NEAM). */
    public static function local(array $fields): array
    {
        $out = [];
        foreach ($fields as $key => $m) {
            $t = $m['text'];
            $en = self::isEnglish($t);
            $push = function (string $orig, string $sugg, string $type, string $sev, string $msg) use (&$out, $key, $m) {
                if ($orig !== $sugg && $orig !== '') {
                    $i = self::issue($key, $m, $orig, $sugg, $type, $sev, $msg);
                    $out[$i['id']] = $i;
                }
            };
            if ($t !== trim($t)) {
                $push($t, trim($t), 'typographie', 'warning', 'Espace en trop au début ou à la fin.');
            }
            if (preg_match_all('/(\S) {2,}(\S)/u', $t, $mm, PREG_SET_ORDER)) {
                foreach ($mm as $x) {
                    $push($x[0], $x[1] . ' ' . $x[2], 'typographie', 'warning', 'Espaces multiples : une seule espace entre deux mots.');
                }
            }
            if (preg_match_all('/(\p{L}+) +([,.])(?=\s|$)/u', $t, $mm, PREG_SET_ORDER)) {
                foreach ($mm as $x) {
                    $push($x[0], $x[1] . $x[2], 'ponctuation', 'warning', 'Pas d\'espace avant une virgule ou un point.');
                }
            }
            if (preg_match_all('/(\p{L}+),(\p{L}+)/u', $t, $mm, PREG_SET_ORDER)) {
                foreach ($mm as $x) {
                    $push($x[0], $x[1] . ', ' . $x[2], 'ponctuation', 'warning', 'Une espace après la virgule.');
                }
            }
            if (preg_match_all('/(\p{Ll}{2,})\.(\p{Lu}\p{Ll}+)/u', $t, $mm, PREG_SET_ORDER)) {
                foreach ($mm as $x) {
                    $push($x[0], $x[1] . '. ' . $x[2], 'ponctuation', 'warning', 'Une espace après le point.');
                }
            }
            if (preg_match_all('/(?<!\p{L})etc\s*(\.{2,}|…)/iu', $t, $mm, PREG_SET_ORDER)) {
                foreach ($mm as $x) {
                    $push($x[0], 'etc.', 'ponctuation', 'warning', '« etc. » prend un seul point, jamais de points de suspension.');
                }
            } elseif (str_contains($t, '...')) {
                $push('...', '…', 'typographie', 'tip', 'Trois points s\'écrivent avec le caractère « … ».');
            }
            if (preg_match_all('/(?<!\p{L})(\p{L}{2,})\s+(\1)(?!\p{L})/iu', $t, $mm, PREG_SET_ORDER)) {
                foreach ($mm as $x) {
                    if (!in_array(mb_strtolower($x[1]), ['nous', 'vous', 'que'], true)) {
                        $push($x[0], $x[1], 'grammaire', 'error', 'Mot répété deux fois.');
                    }
                }
            }
            // Majuscules
            if ($m['kind'] === 'name') {
                $fixed = preg_replace_callback('/(^|[\s\'-])(\p{Ll})/u', fn($x) => $x[1] . mb_strtoupper($x[2]), $t);
                if ($fixed !== $t && $t === mb_strtolower($t)) {
                    $push($t, $fixed, 'majuscule', 'warning', 'Un nom propre commence par une majuscule.');
                }
            } elseif (in_array($m['kind'], ['title', 'text', 'bullet'], true) && preg_match('/^(\p{Ll})(\S*)/u', ltrim($t), $x) && !preg_match('/^(e-|i[A-Z])/u', $x[0])) {
                $push($x[0], mb_strtoupper($x[1]) . $x[2], 'majuscule', 'warning', 'Commence par une majuscule.');
            }
            if (in_array($m['kind'], ['text', 'bullet'], true) && preg_match_all('/([.!?])\s+(\p{Ll})(\p{L}*)/u', $t, $mm, PREG_SET_ORDER)) {
                foreach ($mm as $x) {
                    if (!preg_match('/^(etc|ex|cf|p)$/i', '')) {
                        $push($x[0], $x[1] . ' ' . mb_strtoupper($x[2]) . $x[3], 'majuscule', 'warning', 'Majuscule en début de phrase.');
                    }
                }
            }
            if (!$en) {
                foreach (self::DICT as $wrong => $right) {
                    if ($wrong === $right) {
                        continue;
                    }
                    if (preg_match_all('/(?<![\p{L}\'’])' . preg_quote($wrong, '/') . '(?![\p{L}])/iu', $t, $mm)) {
                        foreach (array_unique($mm[0]) as $found) {
                            $push($found, self::matchCase($found, $right), str_contains($wrong, ' ') || str_contains($wrong, '\'') ? 'grammaire' : 'orthographe', 'error',
                                'Faute fréquente : on écrit « ' . $right . ' ».');
                        }
                    }
                }
                if (in_array($m['kind'], ['text', 'bullet'], true) && preg_match_all('/(?<=[\p{L}\d)»])\s?([:;!?])(?=\s|$)/u', $t, $mm, PREG_SET_ORDER | PREG_OFFSET_CAPTURE)) {
                    foreach ($mm as $x) {
                        $whole = $x[0][0];
                        if ($whole[0] !== ' ' && $whole[0] !== "\u{00A0}") {
                            // Mot précédent + signe, pour une correction sans ambiguïté
                            if (preg_match('/(\p{L}+|\d+|[)»])' . preg_quote($x[1][0], '/') . '(?=\s|$)/u', $t, $w)) {
                                $push($w[0], mb_substr($w[0], 0, -1) . "\u{00A0}" . $x[1][0], 'typographie', 'tip', 'En français, on met une espace avant « ' . $x[1][0] . ' ».');
                            }
                        }
                    }
                }
                if (preg_match_all('/"([^"]{1,80})"/u', $t, $mm, PREG_SET_ORDER)) {
                    foreach ($mm as $x) {
                        $push($x[0], "«\u{00A0}" . $x[1] . "\u{00A0}»", 'typographie', 'tip', 'En français, on utilise les guillemets « ».');
                    }
                }
            }
            foreach (self::PROPER as $low => $proper) {
                if (preg_match_all('/(?<![\p{L}\/.@-])' . preg_quote($low, '/') . '(?![\p{L}.@\/-])/u', $t, $mm)) {
                    foreach (array_unique($mm[0]) as $found) {
                        if ($found !== $proper) {
                            $push($found, $proper, 'majuscule', 'warning', 'Graphie officielle : « ' . $proper . ' ».');
                        }
                    }
                }
            }
            // Conseils de rédaction (non bloquants)
            if (in_array($key, ['profile.bio', 'ai.summary'], true)) {
                $len = mb_strlen($t);
                if ($len > 650) {
                    $push($t, $t . ' ', 'style', 'tip', "Ton accroche fait $len caractères : vise 300 à 500, le recruteur la lira en entier.");
                }
                if (preg_match_all('/(?<!\p{L})(je|j\')(?!\p{L})/iu', $t) >= 4) {
                    $push('je ', 'je ', 'style', 'tip', 'Beaucoup de « je » : commence certaines phrases par un verbe d\'action ou un résultat.');
                }
            }
            if ($m['kind'] === 'bullet' && mb_strlen($t) > 220) {
                $push($t, $t . ' ', 'style', 'tip', 'Puce un peu longue : une idée par puce, une ligne et demie au plus.');
            }
            if ($m['kind'] === 'text' && str_starts_with($key, 'exp.') && mb_strlen($t) > 500 && !preg_match('/\R/u', $t)) {
                $push($t, $t . ' ', 'style', 'tip', 'Description en un seul bloc : découpe-la en 3 ou 4 lignes commençant par un tiret, elles deviendront des puces.');
            }
        }
        // Les conseils de style n'ont pas de correction automatique : leur suggestion est ignorée à l'affichage
        return array_values($out);
    }

    /* ------------------------------------------------------------------ */

    /**
     * Résultat de la relecture (mis en cache tant que le texte ne change pas).
     * $withClaude : true = demander l'avis de Claude si disponible ; false = moteur NEAM seul (ou résultat Claude encore valable).
     */
    public static function check(array $p, bool $withClaude = false, bool $force = false): array
    {
        $fields = self::fields($p);
        $hash = md5(json_encode(array_map(fn($f) => $f['text'], $fields), JSON_UNESCAPED_UNICODE) . 'v1');
        $cache = json_decode((string)($p['cv_proof'] ?? ''), true) ?: [];
        $claudeWanted = $withClaude && AiService::claudeConfigured() && !AiService::quotaReached();
        if (!$force && ($cache['hash'] ?? '') === $hash && (!$claudeWanted || !empty($cache['claude']))) {
            return $cache + ['fields' => $fields];
        }
        $issues = self::local($fields);
        $provider = 'Moteur NEAM';
        $claude = false;
        if ($claudeWanted) {
            $ai = AiService::proofread(array_map(fn($f) => $f['text'], $fields));
            if ($ai !== null) {
                $claude = true;
                $provider = 'Claude + moteur NEAM';
                $byOrig = [];
                foreach ($issues as $i) {
                    $byOrig[$i['field'] . '|' . $i['original']] = $i;
                }
                foreach ($ai as $a) {
                    if (!isset($fields[$a['field']]) || !str_contains($fields[$a['field']]['text'], $a['original'])) {
                        continue;
                    }
                    $type = isset(self::TYPES[$a['type']]) ? $a['type'] : 'orthographe';
                    $sev = in_array($type, ['orthographe', 'grammaire', 'conjugaison', 'accord'], true) ? 'error' : 'warning';
                    $i = self::issue($a['field'], $fields[$a['field']], $a['original'], $a['suggestion'], $type, $sev, $a['explanation'] ?: 'Correction proposée par Claude.', 'Claude');
                    $byOrig[$a['field'] . '|' . $a['original']] = $i;
                }
                $issues = array_values($byOrig);
            } elseif (!empty($cache['claude']) && ($cache['hash'] ?? '') !== $hash) {
                // Claude indisponible : on conserve ses remarques encore applicables
                foreach ($cache['issues'] ?? [] as $old) {
                    if (($old['source'] ?? '') === 'Claude' && isset($fields[$old['field']]) && str_contains($fields[$old['field']]['text'], $old['original'])) {
                        $issues[] = $old;
                    }
                }
            }
        } elseif (!empty($cache['claude'])) {
            // Texte modifié depuis la relecture par Claude : ses remarques encore valables sont conservées sans nouvel appel
            foreach ($cache['issues'] ?? [] as $old) {
                if (($old['source'] ?? '') === 'Claude' && isset($fields[$old['field']]) && str_contains($fields[$old['field']]['text'], $old['original'])) {
                    $issues[] = $old;
                }
            }
            $claude = true;
            $provider = 'Claude + moteur NEAM';
        }
        $result = ['hash' => $hash, 'issues' => array_values($issues), 'provider' => $provider, 'claude' => $claude, 'checked_at' => now()];
        if (!empty($p['user_id'])) {
            DB::update('candidate_profiles', ['cv_proof' => json_encode($result, JSON_UNESCAPED_UNICODE)], 'user_id = :u', ['u' => $p['user_id']]);
        }
        return $result + ['fields' => $fields];
    }

    /** Remarques à traiter (hors ignorées). Bloquantes : erreurs et avertissements. */
    public static function pending(array $result, array $ignored): array
    {
        $open = array_values(array_filter($result['issues'], fn($i) => !in_array($i['id'], $ignored, true)));
        return [
            'open' => $open,
            'blocking' => array_values(array_filter($open, fn($i) => $i['severity'] !== 'tip')),
            'tips' => array_values(array_filter($open, fn($i) => $i['severity'] === 'tip')),
            'ignored' => count($result['issues']) - count($open),
        ];
    }

    /** Applique des corrections (remplacement de la première occurrence dans le texte actuel). Retourne le nombre appliqué. */
    public static function apply(int $uid, array $issues): int
    {
        $n = 0;
        foreach ($issues as $i) {
            if ($i['type'] === 'style') {
                continue;
            }
            $current = self::read($uid, $i['field']);
            if ($current === null || ($pos = mb_strpos($current, $i['original'])) === false) {
                continue;
            }
            $new = mb_substr($current, 0, $pos) . $i['suggestion'] . mb_substr($current, $pos + mb_strlen($i['original']));
            if (self::write($uid, $i['field'], $new)) {
                $n++;
            }
        }
        return $n;
    }

    private const COLUMNS = [
        'exp' => ['table' => 'candidate_experiences', 'cols' => ['title', 'company', 'city', 'description']],
        'edu' => ['table' => 'candidate_educations', 'cols' => ['degree', 'field', 'school', 'description']],
    ];

    private static function read(int $uid, string $field): ?string
    {
        $parts = explode('.', $field);
        return match ($parts[0]) {
            'user' => in_array($parts[1], ['first_name', 'last_name'], true) ? (string)DB::value("SELECT {$parts[1]} FROM users WHERE id = :u", ['u' => $uid]) : null,
            'profile' => in_array($parts[1], ['headline', 'bio', 'certifications', 'interests', 'soft_skills'], true) ? (string)DB::value("SELECT {$parts[1]} FROM candidate_profiles WHERE user_id = :u", ['u' => $uid]) : null,
            'exp', 'edu' => in_array($parts[2] ?? '', self::COLUMNS[$parts[0]]['cols'], true)
                ? (($v = DB::value('SELECT ' . $parts[2] . ' FROM ' . self::COLUMNS[$parts[0]]['table'] . ' WHERE id = :id AND user_id = :u', ['id' => (int)$parts[1], 'u' => $uid])) === null || $v === false ? null : (string)$v) : null,
            'ai' => self::readAi($uid, $parts),
            default => null,
        };
    }

    private static function readAi(int $uid, array $parts): ?string
    {
        $ai = json_decode((string)DB::value('SELECT cv_ai FROM candidate_profiles WHERE user_id = :u', ['u' => $uid]), true) ?: [];
        return match ($parts[1]) {
            'headline' => $ai['headline'] ?? null,
            'summary' => $ai['summary'] ?? null,
            'exp' => $ai['experiences'][(int)($parts[2] ?? 0)][(int)($parts[3] ?? 0)] ?? null,
            default => null,
        };
    }

    private static function write(int $uid, string $field, string $value): bool
    {
        $parts = explode('.', $field);
        switch ($parts[0]) {
            case 'user':
                DB::update('users', [$parts[1] => mb_substr($value, 0, 80)], 'id = :u', ['u' => $uid]);
                return true;
            case 'profile':
                DB::update('candidate_profiles', [$parts[1] => $value, 'updated_at' => now()], 'user_id = :u', ['u' => $uid]);
                return true;
            case 'exp':
            case 'edu':
                DB::update(self::COLUMNS[$parts[0]]['table'], [$parts[2] => $value], 'id = :id AND user_id = :u', ['id' => (int)$parts[1], 'u' => $uid]);
                return true;
            case 'ai':
                $ai = json_decode((string)DB::value('SELECT cv_ai FROM candidate_profiles WHERE user_id = :u', ['u' => $uid]), true) ?: [];
                if ($parts[1] === 'exp') {
                    $ai['experiences'][(int)$parts[2]][(int)$parts[3]] = $value;
                } else {
                    $ai[$parts[1]] = $value;
                }
                DB::update('candidate_profiles', ['cv_ai' => json_encode($ai, JSON_UNESCAPED_UNICODE)], 'user_id = :u', ['u' => $uid]);
                return true;
        }
        return false;
    }
}
