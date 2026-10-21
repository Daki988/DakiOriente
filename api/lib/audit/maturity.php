<?php
/* =========================================================
   NEAM Digital Score — Test rapide de maturité numérique
   8 questions déclaratives (0, 1 ou 2 points) sur l'organisation interne.
   Le Digital Score global = présence en ligne × 65 % + maturité interne × 35 %.
   ========================================================= */
declare(strict_types=1);

const MATURITY_WEIGHT = 0.35;

/** [clé, dimension, question, [réponses 0, 1, 2], action recommandée si < 2] */
function maturity_questions(): array
{
    return [
        ['gestion', 'Outils de gestion', 'Comment suivez-vous vos ventes et vos factures ?', ['Sur papier ou de mémoire', 'Dans un tableur (Excel)', 'Dans un logiciel de gestion'], 'mgmt_tool'],
        ['clients', 'Relation client', 'Où sont enregistrés vos clients ?', ['Dans le téléphone ou nulle part', 'Dans un fichier', 'Dans un CRM ou un logiciel'], 'crm'],
        ['paiement', 'Paiements', 'Comment vos clients peuvent-ils vous payer ?', ['Espèces uniquement', 'Mobile money', 'Mobile money et paiement en ligne'], 'payment'],
        ['automatisation', 'Automatisation', 'Vos relances, devis et confirmations sont-ils automatisés ?', ['Non, tout est fait à la main', 'En partie', 'Oui, en grande partie'], 'automation'],
        ['pilotage', 'Pilotage', 'Connaissez-vous vos chiffres clés chaque mois ?', ['Rarement', 'Approximativement', 'Oui, avec un tableau de bord'], 'dashboard'],
        ['securite', 'Sécurité des données', 'Vos données sont-elles sauvegardées ?', ['Non, ou je ne sais pas', 'Parfois, à la main', 'Oui, automatiquement'], 'backup'],
        ['competences', 'Compétences', 'Vos équipes sont-elles à l’aise avec les outils numériques ?', ['Peu', 'Moyennement', 'Oui, et elles sont formées'], 'training'],
        ['budget', 'Investissement', 'Avez-vous un budget consacré au digital ?', ['Non', 'De temps en temps', 'Oui, chaque mois ou chaque année'], 'digital_budget'],
    ];
}

const MATURITY_LEVELS = [
    [34, 'Émergent', 'L’essentiel de l’activité repose encore sur le papier, le téléphone et la mémoire. Les premiers outils simples vous feront gagner beaucoup de temps.'],
    [59, 'En construction', 'Quelques outils sont en place, mais l’information reste éparpillée. Centraliser et automatiser est la prochaine étape.'],
    [84, 'Structuré', 'Votre organisation est bien outillée. Le pilotage par les chiffres et l’automatisation peuvent encore faire la différence.'],
    [100, 'Avancé', 'Votre entreprise est numériquement mature. L’enjeu est d’innover et de garder l’avance.'],
];

/** Valide les réponses reçues : 8 entiers entre 0 et 2, sinon null. */
function maturity_clean($raw): ?array
{
    if (!is_array($raw)) {
        return null;
    }
    $out = [];
    foreach (maturity_questions() as [$key]) {
        if (!isset($raw[$key]) || !in_array((string) $raw[$key], ['0', '1', '2'], true)) {
            return null;
        }
        $out[$key] = (int) $raw[$key];
    }
    return $out;
}

function maturity_result(array $answers): array
{
    $dims = [];
    $sum = 0;
    foreach (maturity_questions() as [$key, $label, $q, $choices]) {
        $v = $answers[$key];
        $sum += $v;
        $dims[] = ['key' => $key, 'label' => $label, 'question' => $q, 'answer' => $choices[$v], 'score' => $v * 50];
    }
    $score = (int) round($sum / (2 * count($dims)) * 100);
    $level = ['name' => 'Avancé', 'text' => ''];
    foreach (MATURITY_LEVELS as [$max, $name, $text]) {
        if ($score <= $max) {
            $level = ['name' => $name, 'text' => $text];
            break;
        }
    }
    return ['score' => $score, 'level' => $level, 'dims' => $dims];
}

/** Actions issues du test de maturité (mêmes champs que les actions du moteur). */
function maturity_actions(array $answers, array $acts, array $roi): array
{
    $out = [];
    foreach (maturity_questions() as [$key, $label, $q, $choices, $aid]) {
        $v = $answers[$key];
        if ($v >= 2 || !isset($acts[$aid])) {
            continue;
        }
        $a = $acts[$aid];
        $urgency = $v === 0 ? 2 : 1;
        $points = $a['impact'] * 2 + (4 - $a['difficulty']) + $urgency;
        $prio = ($points >= 7 && $a['difficulty'] < 3) ? 1 : ($points >= 5 ? 2 : 3);
        $out[] = [
            'id' => $aid,
            'title' => $a['title'],
            'priority' => $prio,
            'impact' => IMPACT_LABELS[$a['impact']],
            'difficulty' => DIFFICULTY_LABELS[$a['difficulty']],
            'when' => $a['when'],
            'when_label' => WHEN_LABELS[$a['when']],
            'why' => ['Votre réponse : « ' . $choices[$v] . ' » (' . mb_strtolower($label) . ')'],
            'importance' => $a['why'],
            'todo' => $a['todo'],
            'axes' => ['Maturité interne'],
            'roi' => $roi[$aid] ?? null,
            'criteria_failed' => 1,
            'weight' => (2 - $v) * 3 * $a['impact'],
            'source' => 'maturity',
        ];
    }
    return $out;
}
