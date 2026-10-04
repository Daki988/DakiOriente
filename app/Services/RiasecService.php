<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\DB;

/**
 * Test d'orientation RIASEC (Holland) contextualisé pour le Gabon et l'Afrique francophone.
 */
final class RiasecService
{
    public const TYPES = [
        'R' => ['Réaliste', 'Concret, manuel et technique : tu aimes construire, réparer, utiliser des outils et voir le résultat de ton travail.', '#0ea5e9', 'zap'],
        'I' => ['Investigateur', 'Curieux et analytique : tu aimes comprendre, observer, résoudre des problèmes complexes et apprendre.', '#8b5cf6', 'brain'],
        'A' => ['Artistique', 'Créatif et expressif : tu aimes imaginer, concevoir, écrire et sortir des sentiers battus.', '#ec4899', 'sparkles'],
        'S' => ['Social', 'Tourné vers les autres : tu aimes aider, former, conseiller, soigner et travailler en équipe.', '#10b981', 'handshake'],
        'E' => ['Entreprenant', 'Leader et persuasif : tu aimes convaincre, vendre, organiser, prendre des initiatives et des risques.', '#f59e0b', 'rocket'],
        'C' => ['Conventionnel', 'Organisé et rigoureux : tu aimes les chiffres, les procédures, la précision et le travail bien classé.', '#0057ff', 'list-checks'],
    ];

    public static function questions(): array
    {
        return [
            ['R', 'Réparer un groupe électrogène ou une moto en panne'],
            ['I', 'Comprendre pourquoi une épidémie se propage dans une région'],
            ['A', 'Créer l\'affiche d\'un concert ou d\'un événement culturel à Libreville'],
            ['S', 'Aider des élèves de ton quartier à réviser le Bac'],
            ['E', 'Lancer ta propre petite entreprise ou ton commerce'],
            ['C', 'Tenir la comptabilité d\'une boutique ou d\'une association'],
            ['R', 'Travailler sur un chantier, une plateforme pétrolière ou une exploitation forestière'],
            ['I', 'Analyser des données pour trouver une tendance cachée'],
            ['A', 'Écrire des textes, des articles ou des scénarios'],
            ['S', 'Accueillir et orienter des patients dans un centre de santé'],
            ['E', 'Négocier un contrat ou convaincre un client difficile'],
            ['C', 'Classer et vérifier des dossiers administratifs sans erreur'],
            ['R', 'Installer un réseau électrique, solaire ou informatique'],
            ['I', 'Mener une expérience en laboratoire'],
            ['A', 'Concevoir le design d\'une application mobile ou d\'un logo'],
            ['S', 'Animer un atelier de sensibilisation dans une ONG'],
            ['E', 'Diriger une équipe pour atteindre un objectif ambitieux'],
            ['C', 'Préparer un budget précis et suivre les dépenses'],
            ['R', 'Conduire ou piloter des engins, des machines ou des véhicules'],
            ['I', 'Programmer un algorithme qui résout un problème'],
            ['A', 'Photographier ou filmer pour raconter une histoire'],
            ['S', 'Écouter et conseiller une personne qui traverse une difficulté'],
            ['E', 'Prendre la parole en public pour défendre un projet'],
            ['C', 'Utiliser Excel pour organiser des informations'],
            ['R', 'Cultiver, élever ou transformer des produits agricoles'],
            ['I', 'Étudier la biodiversité des parcs nationaux du Gabon'],
            ['A', 'Imaginer une nouvelle collection de vêtements en pagne'],
            ['S', 'Former des collègues à un nouvel outil'],
            ['E', 'Développer les ventes d\'un produit sur les réseaux sociaux'],
            ['C', 'Contrôler la qualité et la conformité d\'un processus'],
        ];
    }

    /** @param array<int,int> $answers index => 0|1|2 */
    public static function score(array $answers): array
    {
        $raw = array_fill_keys(array_keys(self::TYPES), 0);
        $max = array_fill_keys(array_keys(self::TYPES), 0);
        foreach (self::questions() as $i => [$type]) {
            $raw[$type] += max(0, min(2, (int)($answers[$i] ?? 0)));
            $max[$type] += 2;
        }
        $scores = [];
        foreach ($raw as $t => $v) {
            $scores[$t] = (int)round($v / max(1, $max[$t]) * 100);
        }
        arsort($scores);
        $code = implode('', array_slice(array_keys($scores), 0, 3));
        return ['scores' => $scores, 'code' => $code];
    }

    public static function save(int $userId, array $result): void
    {
        DB::insert('riasec_results', [
            'user_id' => $userId, 'scores' => json_encode($result['scores']), 'code' => $result['code'], 'created_at' => now(),
        ]);
        DB::update('candidate_profiles', [
            'riasec_code' => $result['code'], 'riasec_scores' => json_encode($result['scores']), 'updated_at' => now(),
        ], 'user_id = :u', ['u' => $userId]);
    }

    /** Métiers recommandés selon le code RIASEC (pondération par position de la lettre). */
    public static function careers(string $code, int $limit = 8): array
    {
        $families = DB::all('SELECT jf.*, s.name AS sector_name FROM job_families jf LEFT JOIN sectors s ON s.id = jf.sector_id');
        foreach ($families as &$f) {
            $fit = 0;
            foreach (str_split($f['riasec']) as $i => $letter) {
                $pos = strpos($code, $letter);
                if ($pos !== false) {
                    $fit += (3 - $pos) * (3 - $i);
                }
            }
            $f['fit'] = (int)round($fit / 14 * 100);
        }
        unset($f);
        usort($families, fn($a, $b) => $b['fit'] <=> $a['fit']);
        return array_slice(array_filter($families, fn($f) => $f['fit'] > 0), 0, $limit);
    }
}
