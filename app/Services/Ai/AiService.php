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

    /** Claude si configuré, activé et si le quota mensuel de l'utilisateur n'est pas atteint. */
    private static function llm(): ?AiProvider
    {
        if (!self::claudeConfigured() || self::quotaReached()) {
            return null;
        }
        return new AnthropicProvider();
    }

    public static function claudeConfigured(): bool
    {
        return self::enabled() && config('ai.provider') === 'anthropic' && AnthropicProvider::available();
    }

    public static function providerName(): string
    {
        return self::claudeConfigured() ? 'Claude (Anthropic)' : 'Moteur NEAM (règles)';
    }

    /** Générations Claude utilisées ce mois-ci par l'utilisateur connecté (maîtrise des coûts). */
    public static function usage(?int $userId = null): array
    {
        $userId ??= \App\Core\Auth::id();
        $limit = max(0, (int)setting('ai_monthly_limit', 30));
        $used = $userId ? (int)DB::value(
            "SELECT COUNT(*) FROM ai_logs WHERE user_id = :u AND provider = 'anthropic' AND status = 'ok' AND created_at >= :d",
            ['u' => $userId, 'd' => date('Y-m-01 00:00:00')]
        ) : 0;
        return ['used' => $used, 'limit' => $limit, 'remaining' => max(0, $limit - $used)];
    }

    public static function quotaReached(): bool
    {
        $u = \App\Core\Auth::user();
        if (!$u || $u['role'] === 'admin') {
            return false;
        }
        return self::usage((int)$u['id'])['remaining'] <= 0;
    }

    /** Extrait un objet/tableau JSON d'une réponse de modèle (tolère les blocs ```json). */
    private static function json(?string $text): ?array
    {
        if (!$text) {
            return null;
        }
        $t = trim(preg_replace('/^```(?:json)?\s*|\s*```$/m', '', trim($text)));
        $start = strcspn($t, '[{');
        $data = json_decode(substr($t, $start), true);
        return is_array($data) ? $data : null;
    }

    private const SYSTEM = 'Tu es le conseiller carrière de Tremplin by NEAM, plateforme d\'insertion professionnelle au Gabon. '
        . 'Tu écris en français clair, professionnel et chaleureux, adapté au marché de l\'emploi gabonais et d\'Afrique centrale. '
        . 'Tu n\'inventes jamais de faits (diplômes, employeurs, chiffres, dates) : tu n\'utilises que les informations fournies.';

    private static function log(string $feature, string $provider, string $summary, int $chars, string $status = 'ok'): void
    {
        DB::insert('ai_logs', [
            'user_id' => \App\Core\Auth::id(), 'feature' => $feature, 'provider' => $provider,
            'input_summary' => mb_substr($summary, 0, 250), 'output_chars' => $chars, 'status' => $status, 'created_at' => now(),
        ]);
    }

    /* ======================= Coaching sur les écarts ======================= */

    /**
     * Conseil personnalisé à partir de l'analyse des écarts (GapAnalysisService::market).
     * Retourne ['text', 'provider'] ; le repli local reste précis car il s'appuie sur les gains mesurés.
     */
    public static function gapAdvice(array $p, array $analysis): array
    {
        $gaps = array_slice($analysis['gaps'], 0, 5);
        $summary = 'Coaching écarts (' . count($gaps) . ' écarts)';
        if ($gaps && ($llm = self::llm())) {
            $lines = [];
            foreach ($gaps as $i => $g) {
                $recos = array_map(fn($r) => $r['title'] . (isset($r['cost']) ? ' (' . $r['cost'] . ')' : ''), array_filter($g['recos'], fn($r) => $r['kind'] !== 'project'));
                $lines[] = ($i + 1) . '. ' . $g['label'] . ' — demandé dans ' . $g['count'] . ' offre(s) sur ' . count($analysis['jobs'])
                    . ', gain moyen mesuré +' . $g['avg_gain'] . ' points, sévérité ' . $g['severity']
                    . ($recos ? '. Pistes du catalogue : ' . implode(' ; ', array_slice($recos, 0, 3)) : '');
            }
            $prompt = "Voici l'analyse des écarts entre le profil d'un candidat et ses " . count($analysis['jobs']) . " offres les plus proches. "
                . "Score moyen actuel : {$analysis['avg']}/100, atteignable en comblant les 3 premiers écarts : {$analysis['potential']}/100.\n\n"
                . "CANDIDAT :\n" . self::profileBrief($p) . "\n\nÉCARTS PRIORITAIRES :\n" . implode("\n", $lines)
                . (empty($analysis['strengths']) ? '' : "\n\nATOUTS LES PLUS DEMANDÉS : " . implode(', ', array_column($analysis['strengths'], 'name')))
                . "\n\nRédige un conseil personnalisé de 150 à 220 mots, en tutoyant le candidat, sur un ton encourageant, pédagogique et expert. "
                . "Commence par valoriser ses atouts, puis propose un ordre d'action réaliste sur 3 mois en expliquant pourquoi cet ordre. "
                . "Recommande uniquement des certifications et formations présentes dans les pistes fournies ; privilégie les options gratuites quand elles existent. "
                . "N'invente aucun chiffre ni aucun prix. Texte brut, sans markdown, en 3 courts paragraphes.";
            $out = $llm->complete(self::SYSTEM . ' Tu es un coach carrière exigeant mais bienveillant.', $prompt, 1200, 'medium');
            if ($out) {
                self::log('gap_advice', 'anthropic', $summary, mb_strlen($out));
                return ['text' => $out, 'provider' => 'Claude'];
            }
        }
        $out = self::localGapAdvice($p, $analysis);
        self::log('gap_advice', 'local', $summary, mb_strlen($out));
        return ['text' => $out, 'provider' => 'Moteur NEAM'];
    }

    private static function localGapAdvice(array $p, array $a): string
    {
        $first = $p['first_name'] ?? '';
        if (!$a['gaps']) {
            return "$first, ton profil couvre déjà l'essentiel de ce que demandent tes offres les plus proches. "
                . "La priorité maintenant : postuler régulièrement et préparer tes entretiens. C'est là que tout se joue.";
        }
        $p1 = $a['strengths']
            ? "$first, tu pars avec de vrais atouts : " . self::joinFr(array_column(array_slice($a['strengths'], 0, 3), 'name')) . ' reviennent souvent dans les offres qui te correspondent. Garde-les en avant sur ton CV.'
            : "$first, ton profil a une bonne base, et chaque écart ci-dessous peut se combler.";
        $steps = [];
        foreach (array_slice($a['gaps'], 0, 3) as $i => $g) {
            $cert = null;
            foreach ($g['recos'] as $r) {
                if (in_array($r['kind'], ['certification', 'training'], true)) {
                    $cert = $r;
                    break;
                }
            }
            $when = ['Ce mois-ci', 'Le mois prochain', 'Le troisième mois'][$i];
            $steps[] = "$when : " . lcfirst($g['label']) . ' (demandé dans ' . $g['count'] . ' de tes offres, +' . $g['avg_gain'] . ' points en moyenne)'
                . ($cert ? ', par exemple avec « ' . $cert['title'] . ' »' . (isset($cert['cost']) && $cert['cost'] === 'Gratuit' ? ', qui est gratuit' : '') : '') . '.';
        }
        $p2 = "Pour avancer efficacement, attaque les écarts dans cet ordre : il commence par ceux qui débloquent le plus d'offres.\n" . implode("\n", $steps);
        $p3 = "En comblant ces trois écarts, ton score moyen sur tes meilleures offres passerait de {$a['avg']} à {$a['potential']}/100. "
            . 'Ajoute chaque étape à ton plan pour suivre tes progrès : une certification obtenue rejoint automatiquement ton profil.';
        return $p1 . "\n\n" . $p2 . "\n\n" . $p3;
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
            $out = $llm->complete(self::SYSTEM . ' Tu écris des candidatures sobres, précises et percutantes.', $prompt, 1500, 'medium');
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

        $typeLabel = ['stage' => 'stage', 'alternance' => 'alternance', 'premier_emploi' => 'premier emploi', 'cdd' => 'CDD', 'cdi' => 'CDI', 'freelance' => 'mission'];
        $intro = $job
            ? sprintf(
                '%s par votre offre de %s « %s » à %s, je vous adresse ma candidature avec %s.',
                $warm ? 'Vivement intéressé·e' : 'Particulièrement intéressé·e',
                $typeLabel[$job['type']] ?? 'poste',
                $job['title'],
                $job['city_name'] ?: 'distance',
                $warm ? 'beaucoup d\'enthousiasme' : 'conviction'
            )
            : sprintf('Je me permets de vous adresser ma candidature spontanée pour un poste %s au sein de %s.', $p['desired_job'] ? 'de ' . $p['desired_job'] : 'correspondant à mon profil', $company);

        $para2 = $edu
            ? sprintf('Titulaire d\'un diplôme de niveau %s%s (%s)', $levels[$p['education_level']] ?? $edu['degree'], $edu['field'] ? ' en ' . $edu['field'] : '', $edu['school'])
            : sprintf('Fort·e d\'un niveau %s', $levels[$p['education_level']] ?? '');
        $para2 .= ', j\'ai développé de solides compétences en ' . ($highlight ? self::joinFr($highlight) : 'gestion de projets') . '.';
        // Priorité aux expériences professionnelles, puis aux projets
        $pro = array_values(array_filter($p['experiences'], fn($x) => $x['kind'] !== 'projet'));
        $exp = $pro[0] ?? ($p['experiences'][0] ?? null);
        if ($exp) {
            $firstSentence = $exp['description'] ? trim((string)preg_split('/(?<=[.!?])\s+/u', trim($exp['description']))[0]) : '';
            $what = $exp['kind'] === 'projet'
                ? 'Le projet « ' . preg_replace('/^Projet\s*:\s*/u', '', $exp['title']) . ' »'
                : 'Mon expérience de ' . mb_strtolower($exp['title']) . ($exp['company'] ? ' chez ' . $exp['company'] : '');
            $para2 .= ' ' . $what . ' m\'a permis de mettre ces compétences en pratique'
                . ($firstSentence ? ' : ' . mb_strtolower(mb_substr($firstSentence, 0, 1)) . rtrim(mb_substr($firstSentence, 1), '.') . '.' : '.');
        }

        $para3 = $job
            ? sprintf(
                'Rejoindre %s représente pour moi l\'opportunité de contribuer à vos missions%s tout en continuant à progresser. %s',
                $company,
                $job['sector_name'] ? ' dans le secteur ' . mb_strtolower($job['sector_name']) : '',
                $soft ? 'Reconnu·e pour mes qualités (' . mb_strtolower(implode(', ', $soft)) . '), je saurai m\'intégrer rapidement à vos équipes.' : 'Je saurai m\'intégrer rapidement à vos équipes.'
            )
            : 'Votre entreprise attire mon attention par son dynamisme et sa contribution au développement du Gabon. Je serais fier·e de mettre mon énergie à votre service.';

        if ($m && $m['missing_skills']) {
            $para3 .= ' Conscient·e que la compétence « ' . $m['missing_skills'][0]['name'] . ' » est importante pour ce poste, je me forme activement dans ce domaine.';
        }

        $avail = $p['availability_date'] && strtotime($p['availability_date']) > time()
            ? 'Je suis disponible à partir du ' . date_fr($p['availability_date'])
            : 'Je suis disponible immédiatement';
        $outro = $avail . ' et serais ravi·e de vous exposer plus en détail mes motivations lors d\'un entretien.';

        return "Madame, Monsieur,\n\n$intro\n\n$para2\n\n$para3\n\n$outro\n\nJe vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.\n\n$name"
            . ($p['phone'] ? "\n" . $p['phone'] : '') . "\n" . $p['email'];
    }

    /* ======================= Entretien ======================= */

    public static function interviewQuestions(array $p, ?array $job, bool $useClaude = false): array
    {
        if ($useClaude && ($llm = self::llm())) {
            $prompt = "Prépare 7 questions d'entretien pour ce candidat" . ($job ? " qui postule à l'offre ci-dessous" : '') . ". "
                . "Mélange : présentation, motivation, 2 questions techniques sur les compétences demandées, une mise en situation, une question comportementale, une question de conclusion. "
                . "Tutoie le candidat. Réponds UNIQUEMENT avec un tableau JSON : [{\"type\": \"Présentation\", \"q\": \"…\"}].\n\n"
                . "CANDIDAT :\n" . self::profileBrief($p) . ($job ? "\n\nOFFRE :\n" . self::jobBrief($job) : '');
            $data = self::json($llm->complete(self::SYSTEM, $prompt, 1500, 'low'));
            $questions = array_values(array_filter((array)$data, fn($q) => is_array($q) && !empty($q['q'])));
            if (count($questions) >= 4) {
                self::log('interview_questions', 'anthropic', $job ? $job['title'] : 'Entretien général', mb_strlen(json_encode($questions)));
                return array_map(fn($q) => ['type' => mb_substr((string)($q['type'] ?? 'Question'), 0, 30), 'q' => mb_substr((string)$q['q'], 0, 400)], array_slice($questions, 0, 8));
            }
        }
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

    /**
     * Évaluation de toutes les réponses d'une simulation : Claude (feedback personnalisé) avec repli
     * sur la grille déterministe STAR. Retourne une liste [score 0-10, good[], tips[], words].
     */
    public static function evaluateAnswers(array $questions, array $answers, ?array $job = null): array
    {
        $local = [];
        foreach ($questions as $i => $q) {
            $local[$i] = self::evaluateAnswer($q['q'], (string)($answers[$i] ?? ''), $job);
        }
        $answered = array_filter($answers, fn($a) => trim((string)$a) !== '');
        if (!$answered || !($llm = self::llm())) {
            return $local;
        }
        $qa = [];
        foreach ($questions as $i => $q) {
            $qa[] = ['index' => $i, 'question' => $q['q'], 'reponse' => mb_substr(trim((string)($answers[$i] ?? '')), 0, 2000)];
        }
        $prompt = "Évalue les réponses de ce candidat à une simulation d'entretien" . ($job ? " pour le poste « {$job['title']} » chez {$job['company_name']}" : '') . ". "
            . "Pour chaque question : une note de 0 à 10 (0 si pas de réponse), 1 à 3 points forts, 1 à 3 conseils concrets (méthode STAR, chiffres, lien avec le poste). Tutoie le candidat. "
            . "Réponds UNIQUEMENT avec un tableau JSON : [{\"index\": 0, \"score\": 7, \"good\": [\"…\"], \"tips\": [\"…\"]}].\n\n"
            . json_encode($qa, JSON_UNESCAPED_UNICODE);
        $data = self::json($llm->complete(self::SYSTEM . ' Tu es aussi un recruteur exigeant mais bienveillant.', $prompt, 3000, 'low'));
        if (!$data) {
            return $local;
        }
        $out = $local;
        foreach ($data as $row) {
            $i = (int)($row['index'] ?? -1);
            if (!isset($out[$i]) || !isset($row['score'])) {
                continue;
            }
            $out[$i] = [
                'score' => max(0, min(10, (int)$row['score'])),
                'good'  => array_slice(array_map('strval', (array)($row['good'] ?? [])), 0, 3),
                'tips'  => array_slice(array_map('strval', (array)($row['tips'] ?? [])), 0, 3),
                'words' => $local[$i]['words'],
                'ai'    => true,
            ];
        }
        self::log('interview_feedback', 'anthropic', $job ? $job['title'] : 'Entretien général', mb_strlen(json_encode($data)));
        return $out;
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

    /* ======================= CV ======================= */

    /**
     * Rédaction du CV : accroche, titre et réécriture des expériences en puces orientées résultats.
     * Retourne ['headline', 'summary', 'experiences' => [id => [puces]], 'skills_tip', 'provider'].
     */
    public static function cvContent(array $p, ?array $job = null): array
    {
        $summaryLog = 'CV' . ($job ? ' ciblé « ' . $job['title'] . ' »' : '');
        if ($llm = self::llm()) {
            $exps = array_map(fn($x) => ['id' => (int)$x['id'], 'intitule' => $x['title'], 'organisation' => $x['company'], 'type' => $x['kind'], 'description' => $x['description']], $p['experiences']);
            $prompt = "Rédige le contenu d'un CV percutant pour ce candidat" . ($job ? ", ciblé sur l'offre ci-dessous" : '') . ".\n"
                . "- headline : titre professionnel (max 90 caractères)\n"
                . "- summary : accroche de 3 phrases maximum (max 450 caractères), à la première personne sans « je » en début de chaque phrase\n"
                . "- experiences : pour chaque expérience (par id), 2 à 4 puces commençant par un verbe d'action, orientées résultats, sans inventer de chiffres\n"
                . "- skills_tip : un conseil sur les compétences à mettre en avant (1 phrase)\n"
                . "Réponds UNIQUEMENT en JSON : {\"headline\": \"…\", \"summary\": \"…\", \"experiences\": [{\"id\": 1, \"bullets\": [\"…\"]}], \"skills_tip\": \"…\"}.\n\n"
                . "CANDIDAT :\n" . self::profileBrief($p) . "\nEXPÉRIENCES (JSON) : " . json_encode($exps, JSON_UNESCAPED_UNICODE)
                . ($job ? "\n\nOFFRE :\n" . self::jobBrief($job) : '');
            $data = self::json($llm->complete(self::SYSTEM . ' Tu es expert en rédaction de CV.', $prompt, 3000, 'medium'));
            if ($data && !empty($data['summary'])) {
                $bullets = [];
                $known = array_column($p['experiences'], 'id');
                foreach ((array)($data['experiences'] ?? []) as $e) {
                    if (in_array((int)($e['id'] ?? 0), array_map('intval', $known), true)) {
                        $bullets[(int)$e['id']] = array_slice(array_map(fn($b) => mb_substr((string)$b, 0, 220), (array)($e['bullets'] ?? [])), 0, 4);
                    }
                }
                self::log('cv_content', 'anthropic', $summaryLog, mb_strlen(json_encode($data)));
                return [
                    'headline' => mb_substr((string)($data['headline'] ?? $p['headline']), 0, 120),
                    'summary' => mb_substr((string)$data['summary'], 0, 600),
                    'experiences' => $bullets,
                    'skills_tip' => mb_substr((string)($data['skills_tip'] ?? ''), 0, 300),
                    'provider' => 'Claude', 'job' => $job['title'] ?? null, 'generated_at' => now(),
                ];
            }
        }
        // Repli local : accroche construite à partir du profil, puces issues des descriptions
        $levels = education_levels();
        $top = array_slice(array_column(array_filter($p['skills'], fn($s) => $s['category'] === 'tech'), 'name'), 0, 3);
        $summary = trim(sprintf(
            '%s de niveau %s%s. Compétences clés : %s. %s',
            $p['headline'] ?: 'Candidat·e motivé·e',
            $levels[$p['education_level']] ?? '',
            $p['field_of_study'] ? ' en ' . mb_strtolower($p['field_of_study']) : '',
            $top ? self::joinFr($top) : 'polyvalence et apprentissage rapide',
            $p['desired_job'] ? 'Objectif : ' . mb_strtolower($p['desired_job']) . ($job ? ' — candidature pour « ' . $job['title'] . ' ».' : '.') : ''
        ));
        $bullets = [];
        foreach ($p['experiences'] as $x) {
            $sentences = array_filter(array_map('trim', preg_split('/(?<=[.!?])\s+/u', (string)$x['description'])));
            $bullets[(int)$x['id']] = array_slice(array_map(fn($s) => rtrim($s, '.'), $sentences), 0, 3);
        }
        self::log('cv_content', 'local', $summaryLog, mb_strlen($summary));
        return ['headline' => $p['headline'], 'summary' => $summary, 'experiences' => $bullets, 'skills_tip' => '', 'provider' => 'Moteur NEAM', 'job' => $job['title'] ?? null, 'generated_at' => now()];
    }

    /**
     * Relecture orthographique et grammaticale des textes du CV par Claude.
     * Retourne une liste de corrections [{field, original, suggestion, type, explanation}] ou null si Claude est indisponible.
     */
    public static function proofread(array $texts): ?array
    {
        $llm = self::llm();
        if (!$llm || !$texts) {
            return null;
        }
        $prompt = "Relis ces textes d'un CV (clés = identifiants de champ). Relève UNIQUEMENT les vraies fautes : orthographe, grammaire, conjugaison, accords, "
            . "majuscules et typographie française (espace avant : ; ! ?, guillemets « »). Ne réécris pas le style, ne change pas le sens, ne touche pas aux noms propres "
            . "d'entreprises, d'écoles ou de personnes sauf faute évidente. Les textes en anglais sont relus selon les règles anglaises.\n"
            . "Pour chaque faute : \"original\" = extrait EXACT et le plus court possible du texte (quelques mots), \"suggestion\" = ce même extrait corrigé.\n"
            . "Types autorisés : orthographe, grammaire, conjugaison, accord, typographie, majuscule, ponctuation.\n"
            . "Réponds UNIQUEMENT en JSON : {\"issues\": [{\"field\": \"…\", \"original\": \"…\", \"suggestion\": \"…\", \"type\": \"…\", \"explanation\": \"explication courte en français\"}]}. "
            . "S'il n'y a aucune faute : {\"issues\": []}.\n\nTEXTES (JSON) : " . json_encode($texts, JSON_UNESCAPED_UNICODE);
        $data = self::json($llm->complete(self::SYSTEM . ' Tu es correcteur professionnel.', $prompt, 3000, 'low'));
        if (!is_array($data) || !isset($data['issues']) || !is_array($data['issues'])) {
            self::log('cv_proofread', 'anthropic', 'Relecture CV', 0, 'error');
            return null;
        }
        $out = [];
        foreach ($data['issues'] as $i) {
            if (!is_array($i) || !isset($i['field'], $i['original'], $i['suggestion']) || $i['original'] === $i['suggestion'] || mb_strlen((string)$i['original']) > 300) {
                continue;
            }
            $out[] = ['field' => (string)$i['field'], 'original' => (string)$i['original'], 'suggestion' => mb_substr((string)$i['suggestion'], 0, 400),
                'type' => (string)($i['type'] ?? 'orthographe'), 'explanation' => mb_substr((string)($i['explanation'] ?? ''), 0, 200)];
        }
        self::log('cv_proofread', 'anthropic', 'Relecture CV : ' . count($out) . ' correction(s)', mb_strlen(json_encode($out)));
        return $out;
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
