<?php
declare(strict_types=1);

namespace App\Services\Ai;

use App\Core\DB;
use App\Services\MatchingEngine;

/**
 * Orchestration IA NEAM (cahier des charges §9).
 * - Couche déterministe : génération locale à base de règles, toujours disponible et traçable.
 * - Couche LLM optionnelle (Claude) : enrichit la rédaction ; désactivable depuis le back-office.
 * Les décisions sensibles (présélection, refus) ne sont jamais prises par l'IA.
 */
final class AiService
{
    public static function enabled(): bool
    {
        return setting('ai_enabled', '1') === '1';
    }

    private static function llm(): ?AiProvider
    {
        if (!self::enabled() || config('ai.provider') !== 'anthropic' || !AnthropicProvider::available()) {
            return null;
        }
        return new AnthropicProvider();
    }

    public static function providerName(): string
    {
        return self::llm() ? 'Claude (Anthropic)' : 'Moteur NEAM (règles)';
    }

    private static function log(string $feature, string $provider, string $summary, int $chars, string $status = 'ok'): void
    {
        DB::insert('ai_logs', [
            'user_id' => \App\Core\Auth::id(), 'feature' => $feature, 'provider' => $provider,
            'input_summary' => mb_substr($summary, 0, 250), 'output_chars' => $chars, 'status' => $status, 'created_at' => now(),
        ]);
    }

    /* ======================= Lettre de motivation ======================= */

    public static function coverLetter(array $p, ?array $job, string $tone = 'professionnel'): string
    {
        $summary = 'Lettre ' . ($job ? 'pour « ' . $job['title'] . ' »' : 'spontanée') . " ton $tone";
        if ($llm = self::llm()) {
            $prompt = "Rédige une lettre de motivation en français pour ce candidat"
                . ($job ? " qui postule à l'offre ci-dessous" : ' (candidature spontanée)') . ".\n"
                . "Ton : $tone. 250 à 350 mots. Pas d'invention : n'utilise que les faits fournis. "
                . "Structure : accroche, ce que j'apporte (2-3 preuves concrètes), pourquoi cette entreprise, conclusion avec disponibilité. "
                . "Texte brut sans markdown, commençant par « Madame, Monsieur, ».\n\n"
                . "CANDIDAT :\n" . self::profileBrief($p) . ($job ? "\n\nOFFRE :\n" . self::jobBrief($job) : '');
            $out = $llm->complete('Tu es un conseiller en insertion professionnelle au Gabon. Tu écris des candidatures sobres, précises et percutantes.', $prompt, 1500);
            if ($out) {
                self::log('cover_letter', 'anthropic', $summary, mb_strlen($out));
                return $out;
            }
        }
        $out = self::localCoverLetter($p, $job, $tone);
        self::log('cover_letter', 'local', $summary, mb_strlen($out));
        return $out;
    }

    private static function localCoverLetter(array $p, ?array $job, string $tone): string
    {
        $name = trim($p['first_name'] . ' ' . $p['last_name']);
        $levels = education_levels();
        $edu = $p['educations'][0] ?? null;
        $exp = $p['experiences'][0] ?? null;
        $skillsAll = array_column($p['skills'], 'name');
        $matched = [];
        $m = null;
        if ($job) {
            $m = MatchingEngine::compute($p, $job);
            $jobSkillNames = array_column($job['skills'], 'name');
            $matched = array_values(array_intersect($skillsAll, $jobSkillNames));
        }
        $highlight = array_slice($matched ?: $skillsAll, 0, 3);
        $soft = array_slice($p['soft_list'], 0, 2);
        $company = $job['company_name'] ?? 'votre entreprise';
        $warm = $tone === 'enthousiaste';

        $intro = $job
            ? sprintf(
                '%s par votre offre de %s « %s » à %s, je vous adresse ma candidature avec %s.',
                $warm ? 'Vivement intéressé·e' : 'Particulièrement intéressé·e',
                mb_strtolower(job_types()[$job['type']] ?? 'poste'),
                $job['title'],
                $job['city_name'] ?: 'distance',
                $warm ? 'beaucoup d\'enthousiasme' : 'conviction'
            )
            : sprintf('Je me permets de vous adresser ma candidature spontanée pour un poste %s au sein de %s.', $p['desired_job'] ? 'de ' . $p['desired_job'] : 'correspondant à mon profil', $company);

        $para2 = sprintf(
            'Actuellement titulaire d\'un niveau %s%s, j\'ai développé de solides compétences en %s.',
            $levels[$p['education_level']] ?? '',
            $edu ? ' (' . $edu['degree'] . ($edu['field'] ? ' en ' . $edu['field'] : '') . ', ' . $edu['school'] . ')' : '',
            $highlight ? self::joinFr($highlight) : 'gestion de projets'
        );
        if ($exp) {
            $para2 .= sprintf(
                ' Mon expérience %s « %s »%s m\'a permis de mettre ces compétences en pratique%s.',
                $exp['kind'] === 'projet' ? 'sur le projet' : 'en tant que',
                $exp['title'],
                $exp['company'] ? ' chez ' . $exp['company'] : '',
                $exp['description'] ? ' : ' . rtrim(mb_strtolower(mb_substr(excerpt($exp['description'], 160), 0, 1)) . mb_substr(excerpt($exp['description'], 160), 1), '.…') : ''
            );
        }

        $para3 = $job
            ? sprintf(
                'Rejoindre %s représente pour moi l\'opportunité de contribuer à vos missions%s tout en continuant à progresser. %s',
                $company,
                $job['sector_name'] ? ' dans le secteur ' . mb_strtolower($job['sector_name']) : '',
                $soft ? 'Reconnu·e pour ma ' . mb_strtolower(self::joinFr($soft)) . ', je saurai m\'intégrer rapidement à vos équipes.' : 'Je saurai m\'intégrer rapidement à vos équipes.'
            )
            : 'Votre entreprise attire mon attention par son dynamisme et sa contribution au développement du Gabon. Je serais fier·e de mettre mon énergie à votre service.';

        if ($m && $m['missing_skills']) {
            $para3 .= ' Conscient·e que ' . $m['missing_skills'][0]['name'] . ' est importante pour ce poste, je me forme activement sur ce sujet.';
        }

        $avail = $p['availability_date'] && strtotime($p['availability_date']) > time()
            ? 'Je suis disponible à partir du ' . date_fr($p['availability_date'])
            : 'Je suis disponible immédiatement';
        $outro = $avail . ' et serais ravi·e de vous exposer plus en détail mes motivations lors d\'un entretien.';

        return "Madame, Monsieur,\n\n$intro\n\n$para2\n\n$para3\n\n$outro\n\nJe vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.\n\n$name"
            . ($p['phone'] ? "\n" . $p['phone'] : '') . "\n" . $p['email'];
    }

    /* ======================= Entretien ======================= */

    public static function interviewQuestions(array $p, ?array $job): array
    {
        $q = [
            ['type' => 'Présentation', 'q' => 'Présente-toi en deux minutes : ton parcours, ce que tu sais faire et ce que tu cherches.'],
            ['type' => 'Motivation', 'q' => $job ? 'Pourquoi veux-tu rejoindre ' . $job['company_name'] . ' pour ce poste de ' . $job['title'] . ' ?' : 'Quel métier vises-tu et pourquoi ?'],
        ];
        $skills = $job ? array_slice(array_column($job['skills'], 'name'), 0, 2) : array_slice(array_column($p['skills'], 'name'), 0, 2);
        foreach ($skills as $s) {
            $q[] = ['type' => 'Technique', 'q' => "Raconte une situation concrète où tu as utilisé « $s ». Qu'as-tu fait et quel a été le résultat ?"];
        }
        $q[] = ['type' => 'Situation', 'q' => 'Décris un problème difficile que tu as rencontré (études, stage, projet) et comment tu l\'as résolu.'];
        $q[] = ['type' => 'Comportement', 'q' => 'Comment réagis-tu quand tu dois travailler sous pression avec des délais courts ?'];
        if ($job && $job['type'] === 'stage') {
            $q[] = ['type' => 'Projet', 'q' => 'Qu\'attends-tu de ce stage et comment s\'inscrit-il dans ton projet professionnel ?'];
        } else {
            $q[] = ['type' => 'Projet', 'q' => 'Où te vois-tu dans trois ans ?'];
        }
        $q[] = ['type' => 'Conclusion', 'q' => 'As-tu des questions à nous poser ?'];
        return $q;
    }

    /** Évaluation déterministe et explicable d'une réponse (méthode STAR, précision, longueur). */
    public static function evaluateAnswer(string $question, string $answer, ?array $job = null): array
    {
        $a = trim($answer);
        $words = $a === '' ? 0 : count(preg_split('/\s+/u', $a));
        $n = ' ' . normalize($a) . ' ';
        $score = 0;
        $good = [];
        $tips = [];

        if ($words === 0) {
            return ['score' => 0, 'good' => [], 'tips' => ['Réponds à la question : même une réponse courte vaut mieux qu\'un silence.'], 'words' => 0];
        }
        if ($words >= 50 && $words <= 220) {
            $score += 3;
            $good[] = 'Longueur adaptée (' . $words . ' mots)';
        } elseif ($words < 50) {
            $score += 1;
            $tips[] = 'Développe davantage (vise 60 à 180 mots, soit 1 à 2 minutes à l\'oral).';
        } else {
            $score += 2;
            $tips[] = 'Sois plus concis·e : va à l\'essentiel en moins de 2 minutes.';
        }
        $action = preg_match('/\b(j ai|j ai mis|je suis|j ai realise|j ai organise|j ai developpe|j ai gere|j ai cree|j ai propose|j ai analyse|j ai pilote)\b/', $n);
        $context = preg_match('/\b(lors|pendant|quand|dans le cadre|au cours|chez|a l universite|en stage|projet)\b/', $n);
        $result = preg_match('/\b(resultat|permis|ameliore|reduit|augmente|obtenu|reussi|atteint|economise|valide|felicite)\b/', $n);
        $numbers = preg_match('/\d/', $a);
        if ($context) {
            $score += 1;
            $good[] = 'Contexte posé';
        } else {
            $tips[] = 'Pose le contexte (Situation) : où, quand, avec qui ?';
        }
        if ($action) {
            $score += 2;
            $good[] = 'Tu parles de tes actions personnelles (« j\'ai… »)';
        } else {
            $tips[] = 'Parle de TES actions avec « j\'ai… » plutôt que « on » ou « nous ».';
        }
        if ($result) {
            $score += 2;
            $good[] = 'Résultat mis en avant';
        } else {
            $tips[] = 'Termine par le Résultat obtenu : ce qui a changé grâce à toi.';
        }
        if ($numbers) {
            $score += 1;
            $good[] = 'Réponse chiffrée';
        } else {
            $tips[] = 'Ajoute un chiffre (délai, nombre de personnes, %, montant) pour rendre ta réponse mémorable.';
        }
        if ($job) {
            $kw = array_filter(array_map(fn($s) => normalize($s['name']), $job['skills']));
            $hits = array_filter($kw, fn($k) => str_contains($n, ' ' . $k));
            if ($hits) {
                $score += 1;
                $good[] = 'Lien avec les compétences du poste';
            } else {
                $tips[] = 'Fais le lien avec les compétences demandées dans l\'offre.';
            }
        } else {
            $score += 1;
        }
        if (preg_match('/\b(je ne sais pas|aucune idee|rien)\b/', $n)) {
            $score = max(0, $score - 2);
            $tips[] = 'Évite les formules négatives : transforme-les en piste d\'apprentissage.';
        }
        return ['score' => min(10, $score), 'good' => $good, 'tips' => array_slice($tips, 0, 3), 'words' => $words];
    }

    /* ======================= Recruteur ======================= */

    public static function candidateSummary(array $p, ?array $job = null): string
    {
        $levels = education_levels();
        $months = max($p['experience_months'], MatchingEngine::experienceMonths($p['experiences']));
        $top = array_slice(array_column($p['skills'], 'name'), 0, 4);
        $s = sprintf(
            '%s, %s, niveau %s%s. %s Compétences clés : %s.',
            $p['first_name'] . ' ' . mb_substr((string)$p['last_name'], 0, 1) . '.',
            $p['headline'] ?: 'candidat·e',
            $levels[$p['education_level']] ?? '',
            $p['city_name'] ? ', basé·e à ' . $p['city_name'] : '',
            $months ? 'Expérience cumulée : ' . MatchingEngine::monthsLabel($months) . '.' : 'Profil junior, sans expérience professionnelle longue.',
            $top ? self::joinFr($top) : 'non renseignées'
        );
        if ($p['languages_list']) {
            $s .= ' Langues : ' . implode(', ', array_map(fn($l) => $l['name'] . ' (' . $l['level'] . ')', $p['languages_list'])) . '.';
        }
        if ($p['riasec_code']) {
            $s .= ' Profil RIASEC ' . $p['riasec_code'] . '.';
        }
        if ($job) {
            $m = MatchingEngine::compute($p, $job);
            $s .= ' Compatibilité avec l\'offre : ' . $m['score'] . '/100 (' . mb_strtolower($m['level']) . ')';
            $s .= $m['missing_skills'] ? ', à approfondir : ' . self::joinFr(array_slice(array_column($m['missing_skills'], 'name'), 0, 2)) . '.' : '.';
        }
        self::log('candidate_summary', 'local', 'Résumé profil #' . $p['user_id'], mb_strlen($s));
        return $s;
    }

    /* ======================= Utilitaires ======================= */

    private static function profileBrief(array $p): string
    {
        $levels = education_levels();
        $lines = [
            'Nom : ' . $p['first_name'] . ' ' . $p['last_name'],
            'Titre : ' . ($p['headline'] ?: '—'),
            'Ville : ' . ($p['city_name'] ?: '—'),
            'Niveau : ' . ($levels[$p['education_level']] ?? ''),
            'Compétences : ' . implode(', ', array_map(fn($s) => $s['name'] . ' (' . $s['level'] . '/5)', $p['skills'])),
            'Qualités : ' . implode(', ', $p['soft_list']),
            'Langues : ' . implode(', ', array_map(fn($l) => ($l['name'] ?? '') . ' ' . ($l['level'] ?? ''), $p['languages_list'])),
        ];
        foreach ($p['educations'] as $e) {
            $lines[] = 'Formation : ' . $e['degree'] . ' ' . $e['field'] . ', ' . $e['school'] . ' (' . $e['end_year'] . ')';
        }
        foreach ($p['experiences'] as $x) {
            $lines[] = 'Expérience : ' . $x['title'] . ($x['company'] ? ' chez ' . $x['company'] : '') . ' — ' . excerpt($x['description'], 200);
        }
        $lines[] = 'Disponibilité : ' . ($p['availability_date'] ?: 'immédiate');
        $lines[] = 'Email : ' . $p['email'] . ' — Tél : ' . ($p['phone'] ?: '—');
        return implode("\n", $lines);
    }

    private static function jobBrief(array $job): string
    {
        return implode("\n", [
            'Intitulé : ' . $job['title'] . ' (' . (job_types()[$job['type']] ?? $job['type']) . ')',
            'Entreprise : ' . $job['company_name'] . ' — ' . ($job['city_name'] ?? ''),
            'Description : ' . excerpt($job['description'], 600),
            'Missions : ' . excerpt($job['missions'], 500),
            'Compétences : ' . implode(', ', array_column($job['skills'], 'name')),
        ]);
    }

    public static function joinFr(array $items): string
    {
        $items = array_values(array_filter($items));
        if (count($items) <= 1) {
            return (string)($items[0] ?? '');
        }
        $last = array_pop($items);
        return implode(', ', $items) . ' et ' . $last;
    }
}
