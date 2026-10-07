<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\DB;

/**
 * Analyse des écarts entre le profil d'un candidat et ce que recherchent les entreprises.
 *
 * Pour chaque écart (compétence absente ou insuffisante, langue, niveau d'études, expérience,
 * qualités, mobilité), le moteur de matching est relancé sur un profil où l'écart est comblé :
 * le gain affiché est donc mesuré, pas estimé. Chaque écart reçoit ensuite des recommandations
 * concrètes : certifications, formations, projet à réaliser, actions.
 */
final class GapAnalysisService
{
    public const SEVERITY = [
        'bloquant'  => ['Bloquant', 'red', 3],
        'important' => ['Prioritaire', 'amber', 2],
        'bonus'     => ['Atout', 'blue', 1],
    ];
    public const COST = ['gratuit' => ['Gratuit', 'green'], 'mixte' => ['Cours gratuits, examen payant', 'sky'], 'payant' => ['Payant', 'gray']];

    /** Idées de projets concrets pour prouver une compétence, même sans expérience professionnelle. */
    private const PROJECTS = [
        'PHP' => 'Développe une petite application de gestion (bibliothèque, tontine, stock d\'une boutique) avec PHP et une base de données, puis publie le code sur GitHub.',
        'JavaScript' => 'Crée une page interactive utile (calculatrice de budget, quiz, convertisseur FCFA) et mets-la en ligne gratuitement.',
        'Python' => 'Écris un script qui automatise une tâche réelle : renommer des fichiers, analyser un fichier Excel, récupérer des données publiques.',
        'SQL' => 'Construis une base de données d\'exemple (ventes d\'une boutique) et rédige 10 requêtes qui répondent à de vraies questions de gestion.',
        'HTML / CSS' => 'Réalise le site vitrine d\'un commerce ou d\'une association de ton quartier, adapté au mobile.',
        'Développement mobile' => 'Publie une petite application mobile (liste de courses, agenda d\'association) et montre-la en entretien sur ton téléphone.',
        'Réseaux informatiques' => 'Simule un réseau d\'entreprise dans Cisco Packet Tracer (gratuit) : VLAN, routage, adressage, et documente-le.',
        'Cybersécurité' => 'Réalise un audit de sécurité simple d\'un réseau domestique ou d\'association (mots de passe, mises à jour, sauvegardes) et rédige tes recommandations.',
        'Support informatique' => 'Propose ton aide pour l\'informatique d\'une association ou d\'une école : installation, dépannage, et tiens un journal des interventions.',
        'Git' => 'Mets tous tes projets sur GitHub avec un README clair : c\'est ton portfolio de développeur.',
        'Excel avancé' => 'Construis un tableau de bord Excel (tableau croisé dynamique, graphiques, RECHERCHEX) à partir de données réelles, par exemple les dépenses d\'une association.',
        'Power BI' => 'Crée un rapport Power BI à partir de données publiques (budget, démographie, prix) et partage une capture dans ton profil.',
        'Analyse de données' => 'Mène une petite étude chiffrée (enquête auprès de 30 personnes, prix du marché) et présente tes conclusions en une page avec graphiques.',
        'Comptabilité générale' => 'Tiens la comptabilité d\'une association, d\'une tontine ou d\'un petit commerce pendant 3 mois selon le SYSCOHADA.',
        'Contrôle de gestion' => 'Construis le tableau de bord mensuel d\'une petite activité : chiffre d\'affaires, marges, écarts avec le budget.',
        'Analyse financière' => 'Analyse les états financiers publiés d\'une entreprise cotée (ratios, rentabilité, solvabilité) dans une note de deux pages.',
        'Fiscalité' => 'Rédige une fiche pratique sur les principales échéances fiscales d\'une PME au Gabon.',
        'Sage Comptabilité' => 'Entraîne-toi avec une version d\'essai : saisis un mois complet d\'écritures et édite la balance.',
        'Gestion de la relation client' => 'Mets en place un suivi clients simple (fichier ou outil gratuit) pour un commerce et mesure les relances.',
        'Techniques de vente' => 'Vends un produit ou un service pendant un mois (activité personnelle, association) et note tes résultats chiffrés.',
        'Marketing digital' => 'Gère la page d\'un commerce local pendant un mois : objectifs, publications, statistiques avant/après.',
        'Gestion des réseaux sociaux' => 'Crée un calendrier éditorial d\'un mois pour une marque locale et suis l\'engagement obtenu.',
        'Création graphique' => 'Constitue un portfolio de 5 réalisations (logo, affiche, publication) pour des associations ou des commerces.',
        'Rédaction' => 'Ouvre un blog ou rédige 3 articles sur ton domaine : ils serviront d\'exemples de ta plume.',
        'Gestion de projet' => 'Organise un événement (tournoi, conférence, collecte) avec planning, budget et bilan, et décris-le comme un projet.',
        'Logistique' => 'Cartographie le circuit d\'approvisionnement d\'un commerce et propose 3 améliorations chiffrées.',
        'Gestion des stocks' => 'Mets en place un inventaire et un fichier de suivi des stocks pour une boutique ou une association.',
        'Transit & douane' => 'Rédige une fiche sur les étapes d\'un dédouanement à Owendo : documents, acteurs, délais.',
        'HSE' => 'Réalise une évaluation des risques d\'un lieu de travail (atelier, école) et un plan d\'actions de prévention.',
        'Électricité industrielle' => 'Documente une installation que tu as réalisée ou dépannée : schéma, matériel, mesures de sécurité.',
        'Maintenance industrielle' => 'Rédige un plan de maintenance préventive pour un équipement courant (groupe électrogène, pompe).',
        'AutoCAD' => 'Dessine les plans d\'un bâtiment existant (maison, salle de classe) et ajoute-les à ton portfolio.',
        'Génie civil' => 'Réalise un métré et une estimation de coût pour un petit ouvrage (dalle, mur de clôture).',
        'Topographie' => 'Effectue un levé simple d\'une parcelle et produis le plan correspondant.',
        'Géologie' => 'Rédige une synthèse géologique d\'une zone du Gabon à partir de cartes et publications publiques.',
        'Énergie solaire' => 'Dimensionne une installation solaire pour une maison ou une école : besoins, panneaux, batteries, coût.',
        'Gestion forestière' => 'Rédige une note sur un plan d\'aménagement forestier existant et ses enjeux de gestion durable.',
        'SIG / Cartographie' => 'Crée une carte thématique avec QGIS (gratuit) à partir de données ouvertes sur le Gabon.',
        'Agronomie' => 'Suis une petite parcelle ou un jardin pendant une saison et documente rendements, intrants et difficultés.',
        'Gestion des ressources humaines' => 'Construis un processus de recrutement complet pour une association : fiche de poste, grille d\'entretien, intégration.',
        'Pack Office' => 'Réalise un dossier complet : rapport Word mis en forme, tableau Excel, présentation PowerPoint de 10 diapositives.',
        'Suivi-évaluation' => 'Construis le cadre logique et les indicateurs de suivi d\'un projet associatif réel.',
        'Secrétariat' => 'Gère l\'agenda, les courriers et les comptes rendus d\'une association pendant un trimestre.',
    ];

    /** Écarts entre un profil et une offre, triés par importance puis par gain. */
    public static function forJob(array $p, array $job, ?array $match = null, bool $withRecos = true): array
    {
        $match ??= MatchingEngine::compute($p, $job, false);
        $base = (int)$match['score'];
        $detected = self::detect($p, $job, $match);
        // Un écart bloquant plafonne le score : les autres gains sont mesurés une fois ce blocage levé.
        $unblocked = $p;
        foreach ($detected as $g) {
            if ($g['severity'] === 'bloquant') {
                $unblocked = ($g['apply'])($unblocked);
            }
        }
        $ref = $unblocked === $p ? $base : MatchingEngine::compute($unblocked, $job, false)['score'];
        $gaps = [];
        $all = $p;
        foreach ($detected as $g) {
            $g['gain'] = $g['severity'] === 'bloquant'
                ? max(0, $ref - $base)
                : max(0, MatchingEngine::compute(($g['apply'])($unblocked), $job, false)['score'] - $ref);
            $all = ($g['apply'])($all);
            unset($g['apply']);
            if ($withRecos) {
                $g['recos'] = self::recommendations($g, $job);
            }
            $gaps[] = $g;
        }
        usort($gaps, fn($a, $b) => [self::SEVERITY[$b['severity']][2], $b['gain']] <=> [self::SEVERITY[$a['severity']][2], $a['gain']]);
        return [
            'score'     => $base,
            'potential' => $gaps ? MatchingEngine::compute($all, $job, false)['score'] : $base,
            'gaps'      => $gaps,
        ];
    }

    /**
     * Analyse « marché » : les écarts qui reviennent le plus dans les offres les plus proches du profil,
     * classés par gain total. Indique aussi le score moyen atteignable en comblant les 3 premiers.
     */
    public static function market(int $userId, int $limit = 10): array
    {
        $p = ProfileService::load($userId, true);
        if (!$p) {
            return ['jobs' => [], 'gaps' => [], 'avg' => 0, 'potential' => 0, 'strengths' => []];
        }
        $ids = DB::column("SELECT id FROM jobs WHERE status = 'published' AND (deadline IS NULL OR deadline >= :d)", ['d' => date('Y-m-d')]);
        $ranked = [];
        foreach ($ids as $id) {
            $job = MatchingEngine::loadJob((int)$id);
            $ranked[] = ['job' => $job, 'match' => MatchingEngine::compute($p, $job, false)];
        }
        usort($ranked, fn($a, $b) => $b['match']['score'] <=> $a['match']['score']);
        $ranked = array_slice($ranked, 0, $limit);

        $agg = [];
        $skillDemand = [];
        foreach ($ranked as $i => $r) {
            $res = self::forJob($p, $r['job'], $r['match'], false);
            $ranked[$i]['gaps'] = $res['gaps'];
            foreach ($res['gaps'] as $g) {
                $k = $g['key'];
                if (!isset($agg[$k])) {
                    $agg[$k] = $g + ['jobs' => [], 'total' => 0];
                    $agg[$k]['job'] = $r['job'];
                }
                if (self::SEVERITY[$g['severity']][2] > self::SEVERITY[$agg[$k]['severity']][2]) {
                    $agg[$k]['severity'] = $g['severity'];
                }
                $agg[$k]['jobs'][] = ['id' => (int)$r['job']['id'], 'title' => $r['job']['title'], 'company' => $r['job']['company_name'], 'score' => (int)$r['match']['score'], 'gain' => $g['gain']];
                $agg[$k]['total'] += $g['gain'];
            }
            foreach ($r['job']['skills'] as $s) {
                $skillDemand[(int)$s['id']] = ($skillDemand[(int)$s['id']] ?? 0) + 1;
            }
        }
        foreach ($agg as &$g) {
            $g['count'] = count($g['jobs']);
            $g['avg_gain'] = (int)round($g['total'] / max(1, $g['count']));
            $g['priority'] = $g['total'] + ($g['severity'] === 'bloquant' ? 15 : 0) + $g['count'];
        }
        unset($g);
        usort($agg, fn($a, $b) => $b['priority'] <=> $a['priority']);
        $agg = array_values(array_filter($agg, fn($g) => $g['total'] > 0 || $g['severity'] === 'bloquant'));
        $top = array_slice($agg, 0, 8);
        foreach ($top as &$g) {
            $g['recos'] = self::recommendations($g, $g['job']);
            unset($g['job']);
        }
        unset($g);

        // Score moyen atteignable en comblant les 3 écarts prioritaires
        $focus = array_column(array_slice($top, 0, 3), 'key');
        $avg = $ranked ? array_sum(array_map(fn($r) => $r['match']['score'], $ranked)) / count($ranked) : 0;
        $potential = 0;
        foreach ($ranked as $r) {
            $q = $p;
            foreach (self::detect($p, $r['job'], $r['match']) as $g) {
                if (in_array($g['key'], $focus, true)) {
                    $q = ($g['apply'])($q);
                }
            }
            $potential += MatchingEngine::compute($q, $r['job'], false)['score'];
        }
        $potential = $ranked ? $potential / count($ranked) : 0;

        // Atouts : compétences du candidat les plus demandées dans ces offres
        $strengths = [];
        foreach ($p['skills'] as $s) {
            if (!empty($skillDemand[(int)$s['id']])) {
                $strengths[] = ['name' => $s['name'], 'count' => $skillDemand[(int)$s['id']]];
            }
        }
        usort($strengths, fn($a, $b) => $b['count'] <=> $a['count']);

        return [
            'jobs'      => array_map(fn($r) => ['id' => (int)$r['job']['id'], 'title' => $r['job']['title'], 'company' => $r['job']['company_name'], 'score' => (int)$r['match']['score'], 'gaps' => count($r['gaps'])], $ranked),
            'gaps'      => $top,
            'avg'       => (int)round($avg),
            'potential' => (int)round(max($avg, $potential)),
            'focus'     => $focus,
            'strengths' => array_slice($strengths, 0, 6),
        ];
    }

    /* ------------------------------------------------------------------ Détection */

    private static function detect(array $p, array $job, array $match): array
    {
        $gaps = [];
        // Prérequis bloquants d'abord : tant qu'ils manquent, le verdict reste « Prérequis manquant »
        foreach ($match['blocking'] ?? [] as $b) {
            $g = ['key' => 'block:' . $b['type'] . ':' . normalize((string)$b['ref']), 'type' => $b['type'] === 'skill' ? 'skill' : ($b['type'] === 'language' ? 'language' : 'education'),
                'ref' => $b['ref'], 'name' => $b['label'], 'severity' => 'bloquant', 'expected' => $b['type'] === 'skill' ? 1 : null, 'current' => 0,
                'label' => 'Prérequis : ' . $b['label'], 'detail' => ucfirst($b['detail']) . '. Sans ce prérequis, la candidature ne peut pas être retenue, quel que soit le score.'];
            $g['apply'] = function (array $q) use ($b) {
                if ($b['type'] === 'skill') {
                    return MatchingEngine::closeGap($q, ['type' => 'skill', 'ref' => $b['ref'], 'name' => $b['label'], 'expected' => 1]) ?? $q;
                }
                if ($b['type'] === 'language') {
                    $q['languages_list'][] = ['name' => $b['ref'], 'level' => 'C1'];
                    return $q;
                }
                $q['educations'][] = ['degree' => $b['label'], 'field' => '', 'in_progress' => 0, 'level' => (int)$b['ref']];
                $q['education_level'] = max((int)$q['education_level'], (int)$b['ref']);
                return $q;
            };
            $gaps[] = $g;
        }
        foreach ($match['gap_items'] ?? [] as $gi) {
            $sev = match ($gi['type']) {
                'skill', 'level' => (int)$gi['expected'] >= 3 ? 'important' : 'bonus',
                'education', 'language' => 'important',
                'experience' => (int)$gi['expected'] > 0 ? 'important' : 'bonus',
                default => 'bonus',
            };
            $label = match ($gi['type']) {
                'skill' => 'Acquérir « ' . $gi['name'] . ' »',
                'level' => ($gi['capped'] ?? false) ? 'Prouver ton niveau en « ' . $gi['name'] . ' »' : 'Approfondir « ' . $gi['name'] . ' »',
                'education' => 'Niveau d\'études : ' . \App\Services\Referential\Ref::degreeLabel((int)$gi['expected']) . ' attendu',
                'domain' => 'Domaine d\'études à rapprocher du poste',
                'experience' => (int)$gi['expected'] ? 'Expérience : ' . MatchingEngine::monthsLabel((int)$gi['expected']) . ' attendus' : 'Une première expérience ou un projet en lien',
                'language' => ucfirst($gi['name']) . ' : viser le niveau ' . (array_flip(MatchingEngine::LANG_LEVELS)[$gi['expected']] ?? 'B1'),
                'cv' => 'Renforcer la qualité de ton CV',
                default => 'Mobilité et disponibilité',
            };
            $gaps[] = ['key' => $gi['key'], 'type' => $gi['type'], 'ref' => $gi['ref'], 'name' => $gi['name'], 'severity' => $sev, 'label' => $label,
                'expected' => $gi['expected'], 'current' => $gi['current'], 'detail' => $gi['text'] . '.',
                'apply' => fn(array $q) => MatchingEngine::closeGap($q, $gi) ?? $q];
        }
        return $gaps;
    }

    /* ------------------------------------------------------------------ Recommandations */

    public static function recommendations(array $g, array $job): array
    {
        $out = [];
        switch ($g['type']) {
            case 'skill':
            case 'level':
                // D'abord se former (au plus 3 formations reliées à cet écart précis), puis prouver (certification), puis pratiquer (projet)
                if (is_numeric($g['ref'])) {
                    foreach (\App\Services\Referential\TrainingRecommender::forGap((int)$g['ref'], (int)($g['expected'] ?: 3), (int)($g['current'] ?? 0)) as $t) {
                        $out[] = self::trainingReco($t);
                    }
                }
                foreach (self::certificationsForSkill($g['name'], $g['type'] === 'level' ? 'intermediaire' : 'debutant', 2) as $c) {
                    $out[] = self::certReco($c);
                }
                $out[] = ['kind' => 'project', 'title' => 'Projet pour le prouver', 'subtitle' => self::PROJECTS[$g['name']] ?? 'Réalise un mini-projet utilisant « ' . $g['name'] . ' » et décris-le dans ton profil : contexte, ce que tu as fait, résultat obtenu.',
                    'link' => '/espace/profil#experiences', 'external' => false];
                break;
            case 'language':
                foreach (DB::all('SELECT * FROM certifications WHERE language IS NOT NULL ORDER BY id') as $c) {
                    if (normalize((string)$c['language']) === normalize($g['name'])) {
                        $out[] = self::certReco($c);
                    }
                }
                $out = array_slice($out, 0, 2);
                $lang = ucfirst(mb_strtolower($g['name']));
                foreach (array_reverse(\App\Services\Training\TrainingCatalog::forSkill($lang, 2)) as $t) {
                    array_unshift($out, self::trainingReco($t));
                }
                $out[] = ['kind' => 'action', 'title' => 'Pratiquer chaque jour, gratuitement', 'subtitle' => 'Applications d\'apprentissage, podcasts, clubs de conversation, séries en version originale : 20 minutes par jour suffisent pour progresser d\'un niveau en quelques mois.',
                    'link' => '/formations?q=' . urlencode($g['name']), 'external' => false];
                break;
            case 'education':
                $out[] = ['kind' => 'action', 'title' => 'Formation diplômante compatible avec une activité', 'subtitle' => 'Alternance, cours du soir ou formation à distance : tu progresses vers le diplôme sans arrêter de travailler.', 'link' => '/formations', 'external' => false];
                $out[] = ['kind' => 'action', 'title' => 'Validation des acquis de l\'expérience (VAE)', 'subtitle' => 'Si tu as déjà de l\'expérience dans le domaine, renseigne-toi auprès des universités et écoles sur la reconnaissance de tes acquis.', 'link' => null, 'external' => false];
                $out[] = ['kind' => 'action', 'title' => 'En attendant : les offres accessibles à ton niveau', 'subtitle' => 'Beaucoup de postes similaires sont ouverts à ton niveau actuel. Commence par eux pour gagner de l\'expérience.', 'link' => '/offres?education=' . (int)$g['ref'], 'external' => false];
                break;
            case 'experience':
                $out[] = ['kind' => 'action', 'title' => 'Décrocher un stage', 'subtitle' => 'Même court, un stage compte comme une vraie expérience et ouvre souvent la porte à un premier emploi.', 'link' => '/offres?type[]=stage', 'external' => false];
                $out[] = ['kind' => 'action', 'title' => 'S\'engager dans une association ou une ONG', 'subtitle' => 'Le bénévolat développe des compétences concrètes et les recruteurs le valorisent, surtout pour un premier poste.', 'link' => null, 'external' => false];
                $out[] = ['kind' => 'project', 'title' => 'Ajouter tes projets à ton profil', 'subtitle' => 'Projet de fin d\'études, projet personnel, activité familiale : décris ce que TU as fait et le résultat. Chaque projet compte dans ton score.', 'link' => '/espace/profil#experiences', 'external' => false];
                break;
            case 'soft':
                $out[] = ['kind' => 'action', 'title' => 'Ajoute ces qualités à ton profil… avec une preuve', 'subtitle' => 'Pour chacune, prépare un exemple court : la situation, ce que tu as fait, le résultat. C\'est ce que le recruteur retiendra.', 'link' => '/espace/profil', 'external' => false];
                $out[] = ['kind' => 'action', 'title' => 'Entraîne-toi à les raconter', 'subtitle' => 'Le simulateur d\'entretien te fait travailler la méthode STAR sur cette offre.', 'link' => '/espace/entretien?job=' . (int)$job['id'], 'external' => false];
                break;
            case 'mobility':
                $out[] = ['kind' => 'action', 'title' => 'Mettre à jour ta mobilité', 'subtitle' => 'Si tu es prêt·e à déménager pour le bon poste, indique-le dans ton profil : les offres d\'autres villes remonteront.', 'link' => '/espace/profil', 'external' => false];
                break;
        }
        return $out;
    }

    /** Certifications reliées à une compétence, les gratuites et celles du bon niveau d'abord. */
    public static function certificationsForSkill(string $skill, string $level = 'debutant', int $limit = 3): array
    {
        $n = normalize($skill);
        $rows = array_values(array_filter(DB::all('SELECT * FROM certifications WHERE skills IS NOT NULL'), function ($c) use ($n) {
            foreach (explode(',', (string)$c['skills']) as $s) {
                if (normalize($s) === $n) {
                    return true;
                }
            }
            return false;
        }));
        $rank = ['debutant' => 0, 'intermediaire' => 1, 'avance' => 2];
        $costRank = ['gratuit' => 0, 'mixte' => 1, 'payant' => 2];
        usort($rows, fn($a, $b) => [abs(($rank[$a['level']] ?? 0) - $rank[$level]), $costRank[$a['cost']] ?? 2] <=> [abs(($rank[$b['level']] ?? 0) - $rank[$level]), $costRank[$b['cost']] ?? 2]);
        return array_slice($rows, 0, $limit);
    }

    private static function trainingReco(array $t): array
    {
        $cert = \App\Services\Training\TrainingCatalog::CERT[$t['certificate']] ?? null;
        return ['kind' => 'training', 'id' => (int)$t['id'], 'title' => $t['title'],
            'subtitle' => implode(' · ', array_filter([$t['platform_name'], $t['provider'] !== $t['platform_name'] ? $t['provider'] : null, $t['duration'], \App\Services\Training\TrainingCatalog::LANG[$t['language']] ?? null])),
            'cost' => $cert[0] ?? null, 'cost_color' => $cert[1] ?? 'gray', 'platform' => $t['platform_name'],
            'closes' => $t['closes'] ?? null, 'partner' => !empty($t['partner']), 'free' => $t['free'] ?? null,
            'link' => '/formations/' . $t['id'], 'external' => false];
    }

    private static function certReco(array $c): array
    {
        return ['kind' => 'certification', 'id' => (int)$c['id'], 'title' => $c['name'], 'subtitle' => $c['issuer'] . ' · ' . $c['format'] . ' · préparation ' . $c['prep_time'],
            'note' => $c['value_note'], 'cost' => self::COST[$c['cost']][0] ?? 'Payant', 'cost_color' => self::COST[$c['cost']][1] ?? 'gray',
            'link' => $c['url'] ?: '/certifications#c' . $c['id'], 'external' => (bool)$c['url']];
    }

    /* ------------------------------------------------------------------ Plan de progression */

    public static function goals(int $userId): array
    {
        return DB::all("SELECT g.*, c.issuer, c.url, c.prep_time FROM candidate_goals g LEFT JOIN certifications c ON c.id = g.ref_id AND g.kind = 'certification'
            WHERE g.user_id = :u ORDER BY CASE g.status WHEN 'en_cours' THEN 0 WHEN 'todo' THEN 1 ELSE 2 END, g.created_at DESC", ['u' => $userId]);
    }

    /** Objectif atteint : la certification rejoint le profil et ses compétences sont ajoutées (niveau avancé). */
    public static function complete(int $userId, array $goal): array
    {
        $added = [];
        if ($goal['kind'] === 'certification' && $goal['ref_id']) {
            $c = DB::one('SELECT * FROM certifications WHERE id = :id', ['id' => $goal['ref_id']]);
            if ($c) {
                $current = (string)DB::value('SELECT certifications FROM candidate_profiles WHERE user_id = :u', ['u' => $userId]);
                if (mb_stripos($current, $c['name']) === false) {
                    DB::update('candidate_profiles', ['certifications' => mb_substr(trim($current . ($current ? ', ' : '') . $c['name']), 0, 500), 'updated_at' => now()], 'user_id = :u', ['u' => $userId]);
                }
                foreach (array_filter(array_map('trim', explode(',', (string)$c['skills']))) as $name) {
                    $sid = DB::value('SELECT id FROM skills WHERE name = :n', ['n' => $name]);
                    if (!$sid) {
                        continue;
                    }
                    $lvl = DB::value('SELECT level FROM candidate_skills WHERE user_id = :u AND skill_id = :s', ['u' => $userId, 's' => $sid]);
                    if ($lvl === null || $lvl === false) {
                        DB::insert('candidate_skills', ['user_id' => $userId, 'skill_id' => $sid, 'level' => 4]);
                        $added[] = $name;
                    } elseif ((int)$lvl < 4) {
                        DB::update('candidate_skills', ['level' => 4], 'user_id = :u AND skill_id = :s', ['u' => $userId, 's' => $sid]);
                        $added[] = $name;
                    }
                }
            }
        }
        return $added;
    }
}
