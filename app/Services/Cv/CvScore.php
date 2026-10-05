<?php
declare(strict_types=1);

namespace App\Services\Cv;

/** Score de qualité du CV (sur 100) avec la liste concrète de ce qui reste à améliorer. */
final class CvScore
{
    private const ACTION_VERBS = ['géré', 'gérer', 'organisé', 'réalisé', 'conçu', 'développé', 'piloté', 'animé', 'accompagné', 'assuré', 'mis en place', 'participé',
        'rédigé', 'suivi', 'encadré', 'analysé', 'optimisé', 'créé', 'vendu', 'négocié', 'formé', 'coordonné', 'amélioré', 'contribué', 'traité', 'préparé', 'accueilli', 'conduit'];

    public static function compute(array $p, int $blocking, array $s): array
    {
        $ai = $p['cv_ai_data'] ?? null;
        $summary = trim((string)(($ai['summary'] ?? '') ?: ($p['bio'] ?? '')));
        $texts = mb_strtolower(implode(' ', array_map(fn($x) => (string)$x['description'], $p['experiences'] ?? [])) . ' '
            . implode(' ', array_merge(...array_values(array_map('array_values', $ai['experiences'] ?? []) ?: [[]]))));
        $verbs = count(array_filter(self::ACTION_VERBS, fn($v) => str_contains($texts, $v)));
        $t = CvTemplates::get($s['template']);
        $checks = [
            'contact' => [!empty($p['email']) && !empty($p['phone']) && !empty($p['city_id']), 10, 'Coordonnées complètes (e-mail, téléphone, ville)', 'Ajoute ton téléphone et ta ville : sans eux, le recruteur ne peut pas te joindre.', '/espace/profil'],
            'headline' => [trim((string)(($ai['headline'] ?? '') ?: ($p['headline'] ?? ''))) !== '' && mb_strlen($summary) >= 120, 10, 'Titre et accroche percutants', 'Rédige un titre et une accroche de 3 phrases (ou laisse Claude le faire).', '/espace/cv#ia'],
            'experience' => [count($p['experiences'] ?? []) > 0 && count(array_filter($p['experiences'], fn($x) => trim((string)$x['description']) !== '' || !empty($ai['experiences'][$x['id']]))) === count($p['experiences']), 15, 'Expériences décrites', 'Décris chaque stage, projet ou emploi : ce que tu as fait et le résultat obtenu.', '/espace/profil#experiences'],
            'action' => [$verbs >= 3 || preg_match('/\d+\s?(%|personnes|clients|projets|fcfa|k)/u', $texts) === 1, 10, 'Verbes d\'action et résultats chiffrés', 'Commence tes puces par un verbe (« Organisé », « Géré »…) et ajoute un chiffre quand c\'est possible.', '/espace/profil#experiences'],
            'education' => [count($p['educations'] ?? []) > 0, 10, 'Formation renseignée', 'Ajoute au moins ton dernier diplôme ou ta formation en cours.', '/espace/profil#formations'],
            'skills' => [count($p['skills'] ?? []) >= 5, 10, 'Au moins 5 compétences', 'Ajoute les compétences demandées dans les offres qui t\'intéressent.', '/espace/profil#competences'],
            'languages' => [count($p['languages_list'] ?? []) > 0, 5, 'Langues et niveaux', 'Indique tes langues et ton niveau : c\'est souvent un critère éliminatoire.', '/espace/profil'],
            'proof' => [$blocking === 0, 20, 'Zéro faute', 'Corrige les fautes signalées par la relecture : une seule suffit à faire mauvaise impression.', '/espace/cv/apercu#relecture'],
            'links' => [!empty($p['linkedin']) || !empty($p['portfolio']), 5, 'LinkedIn ou portfolio', 'Ajoute ton profil LinkedIn ou un lien vers tes réalisations.', '/espace/profil'],
            'photo' => [$t['key'] === 'ats' || !$t['photo'] || !empty($p['photo_document_id']), 5, $t['photo'] ? 'Photo professionnelle' : 'Modèle adapté', 'Ce modèle met une photo en valeur : ajoute une photo nette, fond uni, tenue professionnelle.', '/espace/cv#photo'],
        ];
        $score = 0;
        $todo = [];
        $done = [];
        foreach ($checks as $key => [$ok, $pts, $label, $tip, $link]) {
            if ($ok) {
                $score += $pts;
                $done[] = $label;
            } else {
                $todo[] = ['key' => $key, 'label' => $label, 'tip' => $tip, 'points' => $pts, 'link' => $link];
            }
        }
        usort($todo, fn($a, $b) => $b['points'] <=> $a['points']);
        return ['score' => $score, 'todo' => $todo, 'done' => $done,
            'level' => $score >= 85 ? ['Excellent', 'green'] : ($score >= 65 ? ['Bon, encore un effort', 'sky'] : ['À renforcer', 'amber'])];
    }
}
