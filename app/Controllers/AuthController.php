<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\DB;
use App\Core\RateLimiter;
use App\Core\Session;
use App\Core\Validator;
use App\Services\NotificationService;

final class AuthController extends Controller
{
    public function loginForm(): string
    {
        return $this->view('auth/login', ['title' => 'Connexion']);
    }

    public function login(): void
    {
        $login = (string)input('login', '');
        $user = Auth::attempt($login, (string)($_POST['password'] ?? ''));
        if (!$user) {
            Session::put('_old', ['login' => $login]);
            Session::put('_errors', ['login' => 'Identifiants incorrects. Vérifie ton e-mail (ou téléphone) et ton mot de passe.']);
            audit('auth.failed', null, null, ['login' => mb_substr($login, 0, 60)]);
            back();
        }
        if ($user['status'] !== 'active') {
            flash('error', 'Ce compte est suspendu. Contacte support@tremplin.ga.');
            back();
        }
        Auth::login($user);
        RateLimiter::clear('login|' . client_ip());
        audit('auth.login', 'user', (int)$user['id']);
        $intended = Session::pull('intended');
        flash('success', 'Bon retour, ' . $user['first_name'] . ' !');
        redirect($intended && str_starts_with($intended, '/') && !str_starts_with($intended, '//') ? $intended : Auth::homeUrl($user));
    }

    public function registerForm(): string
    {
        $role = in_array(input('role'), ['candidate', 'company', 'school'], true) ? input('role') : 'candidate';
        $sectors = DB::all('SELECT id, name FROM sectors ORDER BY name');
        $cities = DB::all("SELECT ci.id, ci.name, co.name AS country FROM cities ci JOIN countries co ON co.id = ci.country_id ORDER BY co.code = 'GA' DESC, co.name, ci.name");
        return $this->view('auth/register', compact('role', 'sectors', 'cities') + ['title' => 'Créer un compte']);
    }

    public function register(): void
    {
        $role = in_array(input('role'), ['candidate', 'company', 'school'], true) ? input('role') : 'candidate';
        $rules = [
            'first_name' => 'required|max:80',
            'last_name'  => 'required|max:80',
            'email'      => 'required|email|max:190|unique:users,email',
            'phone'      => 'nullable|phone',
            'password'   => 'required|min:8|strong|confirmed',
            'terms'      => 'required',
        ];
        if ($role === 'company') {
            $rules += ['org_name' => 'required|max:160', 'sector_id' => 'required|exists:sectors,id', 'city_id' => 'required|exists:cities,id', 'rccm' => 'nullable|max:60'];
        } elseif ($role === 'school') {
            $rules += ['org_name' => 'required|max:190', 'city_id' => 'required|exists:cities,id'];
        }
        $_POST['email'] = mb_strtolower(trim((string)($_POST['email'] ?? '')));
        $d = Validator::make($_POST, $rules)->validateOrBack();

        $userId = DB::transaction(function () use ($d, $role) {
            $id = DB::insert('users', [
                'role' => $role, 'email' => $d['email'], 'phone' => $d['phone'], 'password_hash' => password_hash($d['password'], PASSWORD_DEFAULT),
                'first_name' => $d['first_name'], 'last_name' => $d['last_name'], 'status' => 'active', 'plan_code' => 'FREE',
                'notify_email' => 1, 'notify_sms' => input('consent_sms') ? 1 : 0, 'consent_marketing' => input('consent_marketing') ? 1 : 0,
                'created_at' => now(), 'updated_at' => now(),
            ]);
            if ($role === 'candidate') {
                DB::insert('candidate_profiles', ['user_id' => $id, 'education_level' => 2, 'updated_at' => now()]);
                $code = mb_strtoupper(trim((string)input('school_code', '')));
                if ($code && ($school = DB::one('SELECT id FROM schools WHERE join_code = :c', ['c' => $code]))) {
                    DB::insert('school_students', ['school_id' => $school['id'], 'user_id' => $id, 'cohort' => date('Y'), 'joined_at' => now()]);
                    DB::insert('internships', ['school_id' => $school['id'], 'user_id' => $id, 'status' => 'recherche', 'updated_at' => now()]);
                }
            } elseif ($role === 'company') {
                $slug = slugify($d['org_name']);
                if (DB::value('SELECT COUNT(*) FROM companies WHERE slug = :s', ['s' => $slug])) {
                    $slug .= '-' . substr(bin2hex(random_bytes(2)), 0, 4);
                }
                $cid = DB::insert('companies', [
                    'name' => $d['org_name'], 'slug' => $slug, 'sector_id' => (int)$d['sector_id'], 'city_id' => (int)$d['city_id'],
                    'rccm' => $d['rccm'] ?? null, 'email' => $d['email'], 'phone' => $d['phone'], 'status' => 'pending',
                    'color' => avatar_color($d['org_name']), 'created_at' => now(),
                ]);
                DB::insert('company_users', ['company_id' => $cid, 'user_id' => $id, 'role' => 'owner']);
                foreach (DB::column("SELECT id FROM users WHERE role = 'admin'") as $admin) {
                    NotificationService::notify((int)$admin, 'moderation', 'Nouvelle entreprise à vérifier : ' . $d['org_name'], 'RCCM : ' . ($d['rccm'] ?: 'non fourni'), '/admin/entreprises', false);
                }
            } else {
                DB::insert('schools', [
                    'owner_user_id' => $id, 'name' => $d['org_name'], 'short_name' => mb_strtoupper(mb_substr(preg_replace('/[^A-Za-z]/', '', slugify($d['org_name'])), 0, 6)),
                    'city_id' => (int)$d['city_id'], 'join_code' => strtoupper(substr(bin2hex(random_bytes(4)), 0, 8)), 'created_at' => now(),
                ]);
            }
            return $id;
        });

        $user = DB::one('SELECT * FROM users WHERE id = :id', ['id' => $userId]);
        Auth::login($user);
        audit('auth.register', 'user', $userId, ['role' => $role]);
        NotificationService::notify($userId, 'welcome', 'Bienvenue sur Tremplin, ' . $user['first_name'] . ' !',
            $role === 'candidate' ? 'Complète ton profil pour découvrir tes premiers matchs.' : ($role === 'company' ? 'Votre entreprise est en cours de vérification (24 à 48 h). Vous pouvez déjà préparer vos offres.' : 'Partagez votre code établissement avec vos étudiants.'),
            Auth::homeUrl($user));
        redirect($role === 'candidate' ? '/espace/bienvenue' : Auth::homeUrl($user));
    }

    public function logout(): void
    {
        audit('auth.logout', 'user', Auth::id());
        Auth::logout();
        \App\Core\Session::start();
        flash('info', 'Tu es déconnecté·e. À bientôt !');
        redirect('/');
    }

    public function forgotForm(): string
    {
        return $this->view('auth/forgot', ['title' => 'Mot de passe oublié']);
    }

    public function forgot(): void
    {
        $email = mb_strtolower(trim((string)input('email', '')));
        if (filter_var($email, FILTER_VALIDATE_EMAIL) && DB::one('SELECT id FROM users WHERE email = :e', ['e' => $email])) {
            $token = bin2hex(random_bytes(32));
            DB::delete('password_resets', 'email = :e', ['e' => $email]);
            DB::insert('password_resets', ['email' => $email, 'token_hash' => hash('sha256', $token), 'expires_at' => date('Y-m-d H:i:s', strtotime('+1 hour')), 'created_at' => now()]);
            NotificationService::sendEmail($email, 'Réinitialisation de ton mot de passe Tremplin',
                "Bonjour,\n\nPour choisir un nouveau mot de passe, ouvre ce lien (valable 1 heure) :\n" . url('/reinitialiser/' . $token) . "\n\nSi tu n'es pas à l'origine de cette demande, ignore ce message.\n\n— Tremplin by NEAM");
        }
        // Réponse identique dans tous les cas (pas d'énumération des comptes)
        flash('success', 'Si un compte existe pour cette adresse, un lien de réinitialisation vient d\'être envoyé.');
        redirect('/connexion');
    }

    public function resetForm(string $token): string
    {
        $row = $this->resetRow($token);
        if (!$row) {
            flash('error', 'Ce lien est invalide ou a expiré.');
            redirect('/mot-de-passe-oublie');
        }
        return $this->view('auth/reset', ['token' => $token, 'title' => 'Nouveau mot de passe']);
    }

    public function reset(string $token): void
    {
        $row = $this->resetRow($token);
        if (!$row) {
            flash('error', 'Ce lien est invalide ou a expiré.');
            redirect('/mot-de-passe-oublie');
        }
        $d = Validator::make($_POST, ['password' => 'required|min:8|strong|confirmed'])->validateOrBack();
        DB::update('users', ['password_hash' => password_hash($d['password'], PASSWORD_DEFAULT), 'updated_at' => now()], 'email = :e', ['e' => $row['email']]);
        DB::delete('password_resets', 'email = :e', ['e' => $row['email']]);
        audit('auth.password_reset', 'user', null, ['email' => $row['email']]);
        flash('success', 'Mot de passe mis à jour. Tu peux te connecter.');
        redirect('/connexion');
    }

    private function resetRow(string $token): ?array
    {
        return DB::one('SELECT * FROM password_resets WHERE token_hash = :h AND expires_at > :n', ['h' => hash('sha256', $token), 'n' => now()]);
    }
}
