<?php
declare(strict_types=1);

/*
 * TREMPLIN by NEAM — assistant d'installation en ligne (hébergement mutualisé sans SSH, ex. LWS).
 * 1. Vérifie le serveur  2. Prouve que vous êtes le propriétaire (code déposé dans storage/)
 * 3. Écrit le fichier .env, crée la base et le compte administrateur  4. Se verrouille.
 */

$base = dirname(__DIR__);
$storage = $base . '/storage';
$lock = $storage . '/installed.lock';
$codeFile = $storage . '/install-code.txt';

header('X-Robots-Tag: noindex, nofollow');
header('X-Frame-Options: DENY');
header('Cache-Control: no-store');

function h(mixed $v): string
{
    return htmlspecialchars((string)($v ?? ''), ENT_QUOTES, 'UTF-8');
}

function page(string $title, string $body): never
{
    echo '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">'
        . '<title>' . h($title) . ' · Installation Tremplin</title><style>'
        . 'body{margin:0;font:16px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:#f3f6fc;color:#142144}'
        . '.w{max-width:760px;margin:0 auto;padding:28px 16px 60px}h1{font-size:1.6rem;margin:.2em 0}h2{font-size:1.1rem;margin:1.6em 0 .5em;color:#0a1633}'
        . '.card{background:#fff;border:1px solid #e4eaf5;border-radius:16px;padding:20px;margin:14px 0}.top{display:flex;align-items:center;gap:10px;font-weight:800;color:#0057ff}'
        . 'label{display:block;font-weight:600;margin:12px 0 4px;font-size:.92rem}input,select{width:100%;box-sizing:border-box;padding:11px 12px;border:1px solid #cfd8ea;border-radius:10px;font:inherit;background:#fff}'
        . '.row{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}.hint{font-size:.82rem;color:#5a6788;margin-top:3px}'
        . '.btn{display:inline-block;margin-top:18px;padding:13px 22px;border:0;border-radius:12px;background:#0057ff;color:#fff;font:700 1rem system-ui,sans-serif;cursor:pointer;text-decoration:none}'
        . '.ok{color:#0d7a3f}.ko{color:#c01d24}.warn{background:#fff6dd;border:1px solid #ffe3a3;border-radius:12px;padding:12px 14px}.err{background:#fdecec;border:1px solid #f5c2c4;border-radius:12px;padding:12px 14px}'
        . '.succ{background:#e8f8ef;border:1px solid #b9e8cc;border-radius:12px;padding:12px 14px}ul.checks{list-style:none;padding:0;margin:0}ul.checks li{padding:4px 0}'
        . 'code{background:#eef2f9;padding:1px 6px;border-radius:6px}.check{display:flex;gap:8px;align-items:flex-start;font-weight:500}.check input{width:auto;margin-top:4px}'
        . '</style></head><body><div class="w"><div class="top">◆ Tremplin by NEAM</div>' . $body . '</div></body></html>';
    exit;
}

/* ---------- Déjà installé ---------- */
if (is_file($lock)) {
    http_response_code(403);
    page('Déjà installé', '<h1>La plateforme est déjà installée</h1><div class="card"><p>Par sécurité, cet assistant est désactivé. '
        . 'Supprimez le fichier <code>public/install.php</code> de votre hébergement s\'il est encore présent.</p>'
        . '<p>Pour réinstaller (efface toutes les données) : supprimez <code>storage/installed.lock</code>, puis rouvrez cette page.</p><a class="btn" href="./">Ouvrir la plateforme</a></div>');
}

/* ---------- Prérequis ---------- */
$checks = [
    ['PHP 8.2 ou plus récent (actuel : ' . PHP_VERSION . ')', version_compare(PHP_VERSION, '8.2.0', '>='), true],
    ['Extension PDO MySQL (base MySQL / MariaDB)', extension_loaded('pdo_mysql'), false],
    ['Extension PDO SQLite (alternative sans serveur de base)', extension_loaded('pdo_sqlite'), false],
    ['Extension mbstring', extension_loaded('mbstring'), true],
    ['Extension fileinfo (contrôle des fichiers envoyés)', extension_loaded('fileinfo'), true],
    ['Extension GD (photos, QR code, PDF)', extension_loaded('gd'), true],
    ['Extension cURL (Claude, catalogues de formations)', extension_loaded('curl'), false],
    ['Extension zip (import des CV Word)', extension_loaded('zip'), false],
    ['Bibliothèques incluses (dossier vendor/)', is_file($base . '/vendor/autoload.php'), true],
    ['Dossier storage/ accessible en écriture', is_writable($storage), true],
    ['Dossier racine accessible en écriture (fichier .env)', is_writable($base) || (is_file($base . '/.env') && is_writable($base . '/.env')), true],
];
foreach (['uploads', 'logs', 'cache'] as $d) {
    if (!is_dir("$storage/$d")) {
        @mkdir("$storage/$d", 0775, true);
    }
}
$blocking = array_filter($checks, fn($c) => $c[2] && !$c[1]);
if (!extension_loaded('pdo_mysql') && !extension_loaded('pdo_sqlite')) {
    $blocking[] = ['Aucun pilote de base de données', false, true];
}
$checkHtml = '<ul class="checks">' . implode('', array_map(fn($c) => '<li class="' . ($c[1] ? 'ok' : ($c[2] ? 'ko' : '')) . '">' . ($c[1] ? '✔' : ($c[2] ? '✖' : '–')) . ' ' . h($c[0]) . '</li>', $checks)) . '</ul>';
if ($blocking) {
    page('Prérequis', '<h1>Installation de Tremplin</h1><div class="card"><h2>Le serveur doit être ajusté</h2>' . $checkHtml
        . '<div class="warn" style="margin-top:12px">Sur LWS : <b>Panel LWS › Hébergement › Configuration PHP</b> pour choisir PHP 8.2 ou 8.3 et activer les extensions ; '
        . 'vérifiez aussi que le dossier a bien été décompressé en entier (dossier <code>vendor/</code> compris). Rechargez ensuite cette page.</div></div>');
}

/* ---------- Code de propriété ---------- */
if (!is_file($codeFile)) {
    @file_put_contents($codeFile, strtoupper(substr(bin2hex(random_bytes(6)), 0, 10)) . "\n");
}
$expected = trim((string)@file_get_contents($codeFile));

$host = $_SERVER['HTTP_HOST'] ?? 'localhost';
$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
$dir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/')), '/');
$dir = preg_replace('#/public$#', '', $dir);
$f = $_POST + [
    'app_url' => ($https ? 'https://' : 'http://') . $host . $dir, 'db_driver' => extension_loaded('pdo_mysql') ? 'mysql' : 'sqlite',
    'db_host' => 'localhost', 'db_port' => '3306', 'db_name' => '', 'db_user' => '', 'db_password' => '',
    'admin_first' => '', 'admin_last' => '', 'admin_email' => '', 'admin_password' => '', 'demo' => '',
    'anthropic_key' => '', 'mail_host' => '', 'mail_port' => '465', 'mail_user' => 'contact@neamindustry.com', 'mail_password' => '', 'code' => '',
];
$errors = [];

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    if (!hash_equals($expected, strtoupper(trim((string)$f['code'])))) {
        $errors[] = 'Code de propriété incorrect : ouvrez le fichier storage/install-code.txt avec le gestionnaire de fichiers de LWS et recopiez son contenu.';
    }
    if (!filter_var($f['app_url'], FILTER_VALIDATE_URL)) {
        $errors[] = 'Adresse du site invalide (exemple : https://tremplin.neamindustry.com).';
    }
    if (!filter_var($f['admin_email'], FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'E-mail de l\'administrateur invalide.';
    }
    if (mb_strlen((string)$f['admin_password']) < 10) {
        $errors[] = 'Mot de passe administrateur : 10 caractères au minimum.';
    }
    if (trim((string)$f['admin_first']) === '' || trim((string)$f['admin_last']) === '') {
        $errors[] = 'Indiquez le prénom et le nom de l\'administrateur.';
    }
    $driver = $f['db_driver'] === 'sqlite' ? 'sqlite' : 'mysql';
    if (!$errors && $driver === 'mysql') {
        try {
            $pdo = new PDO('mysql:host=' . $f['db_host'] . ';port=' . (int)$f['db_port'] . ';dbname=' . $f['db_name'] . ';charset=utf8mb4', (string)$f['db_user'], (string)$f['db_password'],
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 8]);
            if ($pdo->query("SHOW TABLES LIKE 'users'")->fetchColumn()) {
                $errors[] = 'Cette base contient déjà une installation de Tremplin. Utilisez une base vide, ou supprimez ses tables depuis phpMyAdmin.';
            }
        } catch (Throwable $e) {
            $errors[] = 'Connexion à la base impossible : ' . $e->getMessage() . ' — vérifiez l\'hôte, le nom de la base, l\'utilisateur et le mot de passe indiqués dans le Panel LWS (rubrique « Bases de données MySQL »).';
        }
    }
    if (!$errors) {
        $q = fn($v) => '"' . str_replace(['\\', '"', "\n", "\r"], ['\\\\', '\\"', '', ''], (string)$v) . '"';
        $env = [
            '# Généré par l\'assistant d\'installation le ' . date('d/m/Y H:i'),
            'APP_NAME="Tremplin by NEAM"', 'APP_URL=' . $q(rtrim((string)$f['app_url'], '/')), 'APP_DEBUG=false', 'APP_DEMO=' . ($f['demo'] ? 'true' : 'false'),
            'APP_TIMEZONE=Africa/Libreville', 'APP_KEY=' . bin2hex(random_bytes(32)), '',
            'DB_DRIVER=' . $driver,
        ];
        if ($driver === 'mysql') {
            array_push($env, 'DB_HOST=' . $q($f['db_host']), 'DB_PORT=' . (int)$f['db_port'], 'DB_NAME=' . $q($f['db_name']), 'DB_USER=' . $q($f['db_user']), 'DB_PASSWORD=' . $q($f['db_password']));
        } else {
            $env[] = 'DB_PATH=' . $q($storage . '/database.sqlite');
        }
        array_push($env, '',
            'MAIL_DRIVER=' . (trim((string)$f['mail_host']) !== '' ? 'smtp' : 'log'), 'MAIL_FROM=contact@neamindustry.com', 'MAIL_FROM_NAME="Tremplin by NEAM"',
            'MAIL_HOST=' . $q($f['mail_host']), 'MAIL_PORT=' . (int)$f['mail_port'], 'MAIL_ENCRYPTION=' . ((int)$f['mail_port'] === 587 ? 'tls' : 'ssl'),
            'MAIL_USERNAME=' . $q($f['mail_user']), 'MAIL_PASSWORD=' . $q($f['mail_password']), 'SMS_DRIVER=log', '',
            'AI_PROVIDER=anthropic', 'ANTHROPIC_API_KEY=' . $q($f['anthropic_key']), 'AI_MODEL=claude-opus-5-5', '',
            'PAYMENT_DRIVER=sandbox', 'UPLOAD_MAX_SIZE=5242880', '');
        if (@file_put_contents($base . '/.env', implode("\n", $env)) === false) {
            $errors[] = 'Impossible d\'écrire le fichier .env à la racine : donnez les droits d\'écriture au dossier (755) puis réessayez.';
        } else {
            @chmod($base . '/.env', 0640);
            try {
                require $base . '/app/bootstrap.php';
                require $base . '/database/Migrator.php';
                @set_time_limit(300);
                Database\Migrator::install((bool)$f['demo'], false);
                $now = date('Y-m-d H:i:s');
                $hash = password_hash((string)$f['admin_password'], PASSWORD_DEFAULT);
                $exists = App\Core\DB::value('SELECT id FROM users WHERE email = :e', ['e' => strtolower(trim((string)$f['admin_email']))]);
                if ($exists) {
                    App\Core\DB::update('users', ['role' => 'admin', 'password_hash' => $hash, 'status' => 'active'], 'id = :id', ['id' => $exists]);
                } else {
                    App\Core\DB::insert('users', [
                        'role' => 'admin', 'email' => strtolower(trim((string)$f['admin_email'])), 'password_hash' => $hash,
                        'first_name' => trim((string)$f['admin_first']), 'last_name' => trim((string)$f['admin_last']), 'status' => 'active', 'plan_code' => 'FREE',
                        'email_verified_at' => $now, 'created_at' => $now, 'updated_at' => $now,
                    ]);
                }
                if ($f['demo']) {
                    // Le compte administrateur de démonstration ne doit pas rester accessible avec un mot de passe public
                    App\Core\DB::update('users', ['password_hash' => password_hash(bin2hex(random_bytes(16)), PASSWORD_DEFAULT), 'status' => 'suspended'], "email = 'admin@tremplin.ga'", []);
                }
                App\Core\DB::insert('settings', ['skey' => 'schema_version', 'svalue' => APP_VERSION]);
                file_put_contents($lock, date('c') . " (assistant web)\n");
                @unlink($codeFile);
                $selfDeleted = @unlink(__FILE__);
                $url = rtrim((string)$f['app_url'], '/');
                page('Installation terminée', '<h1>C\'est en ligne ! 🎉</h1><div class="card"><div class="succ"><b>Tremplin est installé.</b> Base de données créée, catalogue de 311 formations et 60 certifications chargé'
                    . ($f['demo'] ? ', données de démonstration ajoutées (comptes candidat, recruteur et école : mot de passe <code>Tremplin2026!</code>)' : '') . '.</div>'
                    . '<h2>Prochaines étapes</h2><ol>'
                    . '<li>Connectez-vous avec <b>' . h($f['admin_email']) . '</b> : <a href="' . h($url) . '/connexion">' . h($url) . '/connexion</a></li>'
                    . ($selfDeleted ? '<li class="ok">L\'assistant d\'installation s\'est supprimé automatiquement.</li>' : '<li class="ko"><b>Supprimez le fichier <code>public/install.php</code></b> avec le gestionnaire de fichiers (il est déjà verrouillé, mais autant le retirer).</li>')
                    . '<li>Activez le certificat SSL gratuit (Let\'s Encrypt) dans le Panel LWS, puis la redirection HTTPS (voir le guide).</li>'
                    . '<li>Programmez la tâche hebdomadaire de mise à jour des formations (voir le guide, rubrique « Tâches planifiées »).</li></ol>'
                    . '<a class="btn" href="' . h($url) . '/">Ouvrir la plateforme</a></div>');
            } catch (Throwable $e) {
                @unlink($base . '/.env');
                $errors[] = 'Erreur pendant la création de la base : ' . $e->getMessage();
            }
        }
    }
}

/* ---------- Formulaire ---------- */
$err = $errors ? '<div class="err"><b>À corriger :</b><ul>' . implode('', array_map(fn($e) => '<li>' . h($e) . '</li>', $errors)) . '</ul></div>' : '';
$sel = fn($a, $b) => $a === $b ? ' selected' : '';
page('Installation', '<h1>Installation de Tremplin</h1><p>Cinq minutes suffisent. Gardez sous la main les informations de votre base MySQL (Panel LWS › Bases de données).</p>' . $err
    . '<details class="card"><summary><b>Vérification du serveur</b> : tout est prêt ✔</summary>' . $checkHtml . '</details>'
    . '<form method="post" class="card" autocomplete="off">'
    . '<h2>1. Code de propriété</h2><p class="hint" style="font-size:.9rem">Pour prouver que vous gérez cet hébergement, ouvrez le fichier <code>storage/install-code.txt</code> dans le gestionnaire de fichiers LWS (ou par FTP) et recopiez le code.</p>'
    . '<label for="code">Code</label><input id="code" name="code" required value="' . h($f['code']) . '" style="text-transform:uppercase;letter-spacing:.15em;max-width:260px">'
    . '<h2>2. Adresse du site</h2><label for="app_url">URL complète du sous-domaine</label><input id="app_url" name="app_url" required value="' . h($f['app_url']) . '"><div class="hint">Exemple : https://tremplin.neamindustry.com (sans barre oblique finale).</div>'
    . '<h2>3. Base de données</h2><label for="db_driver">Type</label><select id="db_driver" name="db_driver"><option value="mysql"' . $sel($f['db_driver'], 'mysql') . '>MySQL / MariaDB (recommandé sur LWS)</option><option value="sqlite"' . $sel($f['db_driver'], 'sqlite') . '>SQLite (fichier, pour un test rapide)</option></select>'
    . '<div class="row"><div><label for="db_host">Serveur (hôte)</label><input id="db_host" name="db_host" value="' . h($f['db_host']) . '"><div class="hint">Indiqué par LWS avec la base.</div></div><div><label for="db_port">Port</label><input id="db_port" name="db_port" value="' . h($f['db_port']) . '"></div></div>'
    . '<div class="row"><div><label for="db_name">Nom de la base</label><input id="db_name" name="db_name" value="' . h($f['db_name']) . '"></div><div><label for="db_user">Utilisateur</label><input id="db_user" name="db_user" value="' . h($f['db_user']) . '"></div></div>'
    . '<label for="db_password">Mot de passe de la base</label><input id="db_password" name="db_password" type="password" value="' . h($f['db_password']) . '">'
    . '<h2>4. Compte administrateur NEAM</h2><div class="row"><div><label for="admin_first">Prénom</label><input id="admin_first" name="admin_first" required value="' . h($f['admin_first']) . '"></div><div><label for="admin_last">Nom</label><input id="admin_last" name="admin_last" required value="' . h($f['admin_last']) . '"></div></div>'
    . '<div class="row"><div><label for="admin_email">E-mail</label><input id="admin_email" name="admin_email" type="email" required value="' . h($f['admin_email']) . '"></div><div><label for="admin_password">Mot de passe (10 caractères min.)</label><input id="admin_password" name="admin_password" type="password" required minlength="10"></div></div>'
    . '<h2>5. Options (modifiables plus tard dans le fichier .env)</h2>'
    . '<label class="check"><input type="checkbox" name="demo" value="1"' . ($f['demo'] ? ' checked' : '') . '> <span>Ajouter les <b>données de démonstration</b> (entreprises, offres et candidats fictifs) — pour une présentation uniquement, pas pour le lancement public.</span></label>'
    . '<label for="anthropic_key">Clé API Claude (facultatif)</label><input id="anthropic_key" name="anthropic_key" value="' . h($f['anthropic_key']) . '" placeholder="sk-ant-…"><div class="hint">Sans clé, le moteur NEAM rédige CV et lettres. La clé se crée sur console.anthropic.com. Elle reste sur votre serveur.</div>'
    . '<div class="row"><div><label for="mail_host">Serveur SMTP de contact@neamindustry.com (facultatif)</label><input id="mail_host" name="mail_host" value="' . h($f['mail_host']) . '" placeholder="mail.neamindustry.com"></div><div><label for="mail_port">Port SMTP</label><input id="mail_port" name="mail_port" value="' . h($f['mail_port']) . '"></div></div>'
    . '<div class="row"><div><label for="mail_user">Identifiant SMTP</label><input id="mail_user" name="mail_user" value="' . h($f['mail_user']) . '"></div><div><label for="mail_password">Mot de passe SMTP</label><input id="mail_password" name="mail_password" type="password"></div></div>'
    . '<div class="hint">Sans SMTP, les e-mails sont enregistrés dans le back-office (Admin › Communications) au lieu d\'être envoyés.</div>'
    . '<button class="btn" type="submit">Installer Tremplin</button></form>');
