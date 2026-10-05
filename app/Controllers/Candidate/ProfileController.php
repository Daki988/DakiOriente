<?php
declare(strict_types=1);

namespace App\Controllers\Candidate;

use App\Controllers\Controller;
use App\Core\DB;
use App\Core\Validator;
use App\Services\ProfileService;

final class ProfileController extends Controller
{
    private function refs(): array
    {
        return [
            'cities'  => DB::all("SELECT ci.id, ci.name, co.name AS country FROM cities ci JOIN countries co ON co.id = ci.country_id ORDER BY co.code = 'GA' DESC, co.name, ci.name"),
            'sectors' => DB::all('SELECT id, name FROM sectors ORDER BY name'),
            'skillsTech' => DB::all("SELECT id, name FROM skills WHERE category = 'tech' ORDER BY name"),
            'skillsSoft' => DB::all("SELECT id, name FROM skills WHERE category = 'soft' ORDER BY name"),
        ];
    }

    public function onboarding(): string
    {
        $p = ProfileService::load($this->uid());
        return $this->app('candidate/onboarding', $this->refs() + ['p' => $p, 'title' => 'Bienvenue']);
    }

    public function saveOnboarding(): void
    {
        $d = Validator::make($_POST, [
            'headline' => 'required|max:160', 'city_id' => 'required|exists:cities,id', 'education_level' => 'required|between:0,7',
            'field_of_study' => 'nullable|max:150', 'desired_job' => 'required|max:150', 'desired_sector_id' => 'nullable|exists:sectors,id',
        ])->validateOrBack();
        $uid = $this->uid();
        $types = array_values(array_intersect((array)($_POST['types'] ?? []), array_keys(job_types())));
        $soft = array_filter(array_map('intval', (array)($_POST['soft'] ?? [])));
        $softNames = $soft ? DB::column('SELECT name FROM skills WHERE id IN (' . DB::in('s', $soft)[0] . ')', DB::in('s', $soft)[1]) : [];
        DB::update('candidate_profiles', [
            'headline' => $d['headline'], 'city_id' => (int)$d['city_id'], 'education_level' => (int)$d['education_level'],
            'field_of_study' => $d['field_of_study'], 'desired_job' => $d['desired_job'], 'desired_sector_id' => $this->intOrNull($d['desired_sector_id']),
            'desired_types' => implode(',', $types), 'soft_skills' => implode(',', $softNames),
            'languages' => json_encode([['name' => 'Français', 'level' => 'C1']], JSON_UNESCAPED_UNICODE), 'updated_at' => now(),
        ], 'user_id = :u', ['u' => $uid]);
        foreach (array_slice(array_map('intval', (array)($_POST['skills'] ?? [])), 0, 20) as $sid) {
            DB::run('DELETE FROM candidate_skills WHERE user_id = :u AND skill_id = :s', ['u' => $uid, 's' => $sid]);
            DB::insert('candidate_skills', ['user_id' => $uid, 'skill_id' => $sid, 'level' => 3]);
        }
        foreach ($soft as $sid) {
            DB::run('DELETE FROM candidate_skills WHERE user_id = :u AND skill_id = :s', ['u' => $uid, 's' => $sid]);
            DB::insert('candidate_skills', ['user_id' => $uid, 'skill_id' => $sid, 'level' => 4]);
        }
        $score = ProfileService::refreshCompletion($uid);
        flash('success', "Profil créé, bravo ! Ton premier score d'employabilité est de $score / 100. Ce n'est qu'un point de départ : voici tes premières offres compatibles et la prochaine action pour progresser.");
        redirect('/espace/recommandations');
    }

    public function edit(): string
    {
        $p = ProfileService::load($this->uid(), true);
        $completion = ProfileService::completion($p);
        $school = DB::one('SELECT s.* FROM school_students ss JOIN schools s ON s.id = ss.school_id WHERE ss.user_id = :u', ['u' => $this->uid()]);
        return $this->app('candidate/profile', $this->refs() + compact('p', 'completion', 'school') + ['title' => 'Mon profil']);
    }

    public function update(): void
    {
        $d = Validator::make($_POST, [
            'first_name' => 'required|max:80', 'last_name' => 'required|max:80', 'phone' => 'nullable|phone',
            'headline' => 'nullable|max:160', 'bio' => 'nullable|max:1500', 'city_id' => 'nullable|exists:cities,id',
            'birth_date' => 'nullable|date', 'education_level' => 'required|between:0,7', 'field_of_study' => 'nullable|max:150',
            'experience_months' => 'nullable|between:0,600', 'desired_job' => 'nullable|max:150', 'desired_sector_id' => 'nullable|exists:sectors,id',
            'desired_salary' => 'nullable|between:0,100000000', 'mobility' => 'required|in:ville,national,international',
            'availability_date' => 'nullable|date', 'certifications' => 'nullable|max:500',
            'linkedin' => 'nullable|url|max:255', 'portfolio' => 'nullable|url|max:255',
        ])->validateOrBack();
        $uid = $this->uid();
        $types = array_values(array_intersect((array)($_POST['types'] ?? []), array_keys(job_types())));
        $soft = array_values(array_filter(array_map('trim', (array)($_POST['soft'] ?? []))));
        DB::transaction(function () use ($d, $uid, $types, $soft) {
            DB::update('users', ['first_name' => $d['first_name'], 'last_name' => $d['last_name'], 'phone' => $d['phone'], 'updated_at' => now()], 'id = :id', ['id' => $uid]);
            DB::update('candidate_profiles', [
                'headline' => $d['headline'], 'bio' => $d['bio'], 'city_id' => $this->intOrNull($d['city_id']), 'birth_date' => $d['birth_date'],
                'education_level' => (int)$d['education_level'], 'field_of_study' => $d['field_of_study'], 'experience_months' => (int)($d['experience_months'] ?? 0),
                'desired_job' => $d['desired_job'], 'desired_sector_id' => $this->intOrNull($d['desired_sector_id']), 'desired_types' => implode(',', $types),
                'desired_salary' => $this->intOrNull($d['desired_salary']), 'remote_ok' => input('remote_ok') ? 1 : 0, 'mobility' => $d['mobility'],
                'availability_date' => $d['availability_date'], 'certifications' => $d['certifications'], 'soft_skills' => implode(',', $soft),
                'linkedin' => $d['linkedin'], 'portfolio' => $d['portfolio'], 'visible_to_recruiters' => input('visible_to_recruiters') ? 1 : 0, 'updated_at' => now(),
            ], 'user_id = :u', ['u' => $uid]);
        });
        $score = ProfileService::refreshCompletion($uid);
        flash('success', "Profil enregistré. Ton score d'employabilité est maintenant de $score / 100.");
        redirect('/espace/profil');
    }

    public function addSkill(): void
    {
        $uid = $this->uid();
        $level = max(1, min(5, (int)input('level', 3)));
        $skillId = (int)input('skill_id', 0);
        $name = trim((string)input('skill_name', ''));
        if (!$skillId && $name !== '') {
            $existing = DB::one('SELECT id FROM skills WHERE slug = :s', ['s' => slugify($name)]);
            $skillId = $existing ? (int)$existing['id'] : DB::insert('skills', ['name' => mb_substr($name, 0, 120), 'slug' => slugify($name), 'category' => 'tech', 'aliases' => '']);
        }
        if (!$skillId || !DB::value('SELECT COUNT(*) FROM skills WHERE id = :id', ['id' => $skillId])) {
            flash('error', 'Choisis une compétence dans la liste ou saisis son nom.');
            back();
        }
        DB::run('DELETE FROM candidate_skills WHERE user_id = :u AND skill_id = :s', ['u' => $uid, 's' => $skillId]);
        DB::insert('candidate_skills', ['user_id' => $uid, 'skill_id' => $skillId, 'level' => $level]);
        ProfileService::refreshCompletion($uid);
        flash('success', 'Compétence ajoutée ! Tes scores de compatibilité ont été recalculés : va voir quelles offres se rapprochent de toi.');
        redirect('/espace/profil#competences');
    }

    public function removeSkill(string $id): void
    {
        DB::delete('candidate_skills', 'user_id = :u AND skill_id = :s', ['u' => $this->uid(), 's' => (int)$id]);
        ProfileService::refreshCompletion($this->uid());
        flash('info', 'Compétence retirée.');
        redirect('/espace/profil#competences');
    }

    public function addEducation(): void
    {
        $d = Validator::make($_POST, [
            'school' => 'required|max:160', 'degree' => 'required|max:160', 'field' => 'nullable|max:160',
            'start_year' => 'nullable|between:1970,2040', 'end_year' => 'nullable|between:1970,2040', 'description' => 'nullable|max:600',
        ])->validateOrBack();
        DB::insert('candidate_educations', ['user_id' => $this->uid()] + array_map(fn($v) => $v === '' ? null : $v, $d));
        ProfileService::refreshCompletion($this->uid());
        flash('success', 'Formation ajoutée. Elle compte dans ton score sur toutes les offres.');
        redirect('/espace/profil#formations');
    }

    public function removeEducation(string $id): void
    {
        DB::delete('candidate_educations', 'id = :id AND user_id = :u', ['id' => (int)$id, 'u' => $this->uid()]);
        ProfileService::refreshCompletion($this->uid());
        flash('info', 'Formation supprimée.');
        redirect('/espace/profil#formations');
    }

    public function addExperience(): void
    {
        $d = Validator::make($_POST, [
            'title' => 'required|max:160', 'company' => 'nullable|max:160', 'kind' => 'required|in:stage,emploi,projet,benevolat,alternance',
            'city' => 'nullable|max:100', 'start_date' => 'nullable|date', 'end_date' => 'nullable|date', 'description' => 'nullable|max:1500',
        ])->validateOrBack();
        DB::insert('candidate_experiences', ['user_id' => $this->uid()] + array_map(fn($v) => $v === '' ? null : $v, $d));
        // Extraction automatique des compétences citées dans la description
        $found = ProfileService::extractSkills(($d['title'] ?? '') . ' ' . ($d['description'] ?? ''));
        $added = [];
        foreach ($found as $s) {
            if (!DB::value('SELECT COUNT(*) FROM candidate_skills WHERE user_id = :u AND skill_id = :s', ['u' => $this->uid(), 's' => $s['id']])) {
                DB::insert('candidate_skills', ['user_id' => $this->uid(), 'skill_id' => $s['id'], 'level' => 2]);
                $added[] = $s['name'];
            }
        }
        ProfileService::refreshCompletion($this->uid());
        flash('success', 'Expérience ajoutée. Chaque expérience, même courte, rassure les recruteurs.' . ($added ? ' Nous avons repéré et ajouté ces compétences : ' . implode(', ', $added) . '.' : ''));
        redirect('/espace/profil#experiences');
    }

    public function removeExperience(string $id): void
    {
        DB::delete('candidate_experiences', 'id = :id AND user_id = :u', ['id' => (int)$id, 'u' => $this->uid()]);
        ProfileService::refreshCompletion($this->uid());
        flash('info', 'Expérience supprimée.');
        redirect('/espace/profil#experiences');
    }

    public function saveLanguages(): void
    {
        $out = [];
        $names = (array)($_POST['lang_name'] ?? []);
        $levels = (array)($_POST['lang_level'] ?? []);
        foreach ($names as $i => $n) {
            $n = trim((string)$n);
            $l = (string)($levels[$i] ?? 'B1');
            if ($n !== '' && isset(language_levels()[$l])) {
                $out[] = ['name' => mb_substr($n, 0, 40), 'level' => $l];
            }
        }
        DB::update('candidate_profiles', ['languages' => json_encode(array_slice($out, 0, 8), JSON_UNESCAPED_UNICODE), 'updated_at' => now()], 'user_id = :u', ['u' => $this->uid()]);
        ProfileService::refreshCompletion($this->uid());
        flash('success', 'Langues enregistrées. Beaucoup d\'offres au Gabon demandent l\'anglais : c\'est un vrai atout si tu le maîtrises.');
        redirect('/espace/profil#langues');
    }

    public function joinSchool(): void
    {
        $code = mb_strtoupper(trim((string)input('code', '')));
        $school = DB::one('SELECT * FROM schools WHERE join_code = :c', ['c' => $code]);
        if (!$school) {
            flash('error', 'Code établissement inconnu. Vérifie-le auprès de ton école.');
            back();
        }
        if (!DB::value('SELECT COUNT(*) FROM school_students WHERE school_id = :s AND user_id = :u', ['s' => $school['id'], 'u' => $this->uid()])) {
            DB::insert('school_students', ['school_id' => $school['id'], 'user_id' => $this->uid(), 'program' => mb_substr((string)input('program', ''), 0, 150) ?: null, 'cohort' => date('Y'), 'joined_at' => now()]);
            DB::insert('internships', ['school_id' => $school['id'], 'user_id' => $this->uid(), 'status' => 'recherche', 'updated_at' => now()]);
            audit('school.joined', 'school', (int)$school['id']);
        }
        flash('success', 'Tu es maintenant rattaché·e à ' . $school['name'] . '. Ton école pourra te recommander des offres et suivre ton stage avec toi.');
        redirect('/espace/profil');
    }
}
