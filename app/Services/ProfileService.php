<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\DB;

/**
 * Chargement et calcul du profil candidat (données consolidées utilisées par le matching, le CV et l'IA).
 */
final class ProfileService
{
    private static array $cache = [];

    public static function load(int $userId, bool $fresh = false): ?array
    {
        if (!$fresh && isset(self::$cache[$userId])) {
            return self::$cache[$userId];
        }
        $p = DB::one(
            'SELECT u.id AS user_id, u.first_name, u.last_name, u.email, u.phone, u.plan_code, u.created_at AS member_since,
                    cp.*, c.name AS city_name, c.country_id, co.name AS country_name, s.name AS desired_sector_name
             FROM users u
             LEFT JOIN candidate_profiles cp ON cp.user_id = u.id
             LEFT JOIN cities c ON c.id = cp.city_id
             LEFT JOIN countries co ON co.id = c.country_id
             LEFT JOIN sectors s ON s.id = cp.desired_sector_id
             WHERE u.id = :id',
            ['id' => $userId]
        );
        if (!$p) {
            return null;
        }
        $p['user_id'] = $userId;
        $p['skills'] = DB::all(
            'SELECT s.id, s.name, s.slug, s.category, cs.level FROM candidate_skills cs JOIN skills s ON s.id = cs.skill_id
             WHERE cs.user_id = :u ORDER BY cs.level DESC, s.name',
            ['u' => $userId]
        );
        $p['educations'] = DB::all('SELECT * FROM candidate_educations WHERE user_id = :u ORDER BY end_year DESC, start_year DESC', ['u' => $userId]);
        $p['experiences'] = DB::all('SELECT * FROM candidate_experiences WHERE user_id = :u ORDER BY start_date DESC', ['u' => $userId]);
        $p['languages_list'] = json_decode((string)($p['languages'] ?? ''), true) ?: [];
        $p['soft_list'] = array_values(array_filter(array_map('trim', explode(',', (string)($p['soft_skills'] ?? '')))));
        $p['types_list'] = array_values(array_filter(explode(',', (string)($p['desired_types'] ?? ''))));
        $p['riasec'] = json_decode((string)($p['riasec_scores'] ?? ''), true) ?: [];
        $p['cv_ai_data'] = json_decode((string)($p['cv_ai'] ?? ''), true) ?: null;
        $p['certificates'] = DB::all("SELECT id, title, issuer, issued_at, credential_url, status FROM candidate_certificates WHERE user_id = :u AND status != 'refuse' ORDER BY issued_at DESC, id DESC", ['u' => $userId]);
        $p['education_level'] = (int)($p['education_level'] ?? 2);
        $p['experience_months'] = (int)($p['experience_months'] ?? 0);
        return self::$cache[$userId] = $p;
    }

    /** Pourcentage de complétion du profil + éléments manquants. */
    public static function completion(array $p): array
    {
        $checks = [
            'headline'    => [!empty($p['headline']), 'Ajoute un titre de profil', 10],
            'city'        => [!empty($p['city_id']), 'Indique ta ville', 8],
            'bio'         => [mb_strlen((string)($p['bio'] ?? '')) >= 60, 'Rédige une courte présentation (60 caractères min.)', 10],
            'education'   => [count($p['educations']) > 0, 'Ajoute au moins une formation', 14],
            'experience'  => [count($p['experiences']) > 0, 'Ajoute un stage, un projet ou une expérience', 14],
            'skills'      => [count($p['skills']) >= 5, 'Renseigne au moins 5 compétences', 16],
            'languages'   => [count($p['languages_list']) > 0, 'Précise les langues que tu parles', 8],
            'desired_job' => [!empty($p['desired_job']), 'Indique le métier que tu vises', 8],
            'types'       => [count($p['types_list']) > 0, 'Choisis les types d\'opportunités recherchées', 6],
            'phone'       => [!empty($p['phone']), 'Ajoute ton numéro de téléphone', 6],
        ];
        $score = 0;
        $missing = [];
        foreach ($checks as $key => [$ok, $label, $w]) {
            if ($ok) {
                $score += $w;
            } else {
                $missing[$key] = $label;
            }
        }
        return ['percent' => $score, 'missing' => $missing];
    }

    public static function refreshCompletion(int $userId): int
    {
        $p = self::load($userId, true);
        $c = self::completion($p);
        DB::update('candidate_profiles', ['completion' => $c['percent'], 'updated_at' => now()], 'user_id = :u', ['u' => $userId]);
        $score = EmployabilityService::compute($userId, true);
        unset(self::$cache[$userId]);
        return $score['score'];
    }

    /** Compétences reconnues dans un texte libre (référentiel + alias). */
    public static function extractSkills(string $text): array
    {
        $norm = ' ' . normalize($text) . ' ';
        $found = [];
        foreach (DB::all('SELECT id, name, aliases, category FROM skills') as $s) {
            $terms = array_filter(array_map('trim', explode(',', $s['name'] . ',' . (string)$s['aliases'])));
            foreach ($terms as $t) {
                $nt = normalize($t);
                if ($nt !== '' && preg_match('/(?<![a-z0-9])' . preg_quote($nt, '/') . '(?![a-z0-9])/', $norm)) {
                    $found[$s['id']] = $s;
                    break;
                }
            }
        }
        return array_values($found);
    }
}
