<?php
declare(strict_types=1);

/*
 * TREMPLIN by NEAM — installation express (hébergement mutualisé sans SSH, ex. LWS).
 * Un seul écran : nom, e-mail et mot de passe de l'administrateur. Base intégrée (SQLite) par défaut,
 * MySQL en option. Le lien d'installation contient une clé (fichier storage/install-key.txt fourni avec l'archive) ;
 * à défaut, un code est déposé dans storage/install-code.txt. L'assistant se verrouille et se supprime ensuite.
 */

$base = dirname(__DIR__);
$storage = $base . '/storage';
$lock = $storage . '/installed.lock';
$keyFile = $storage . '/install-key.txt';
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
        . '<title>' . h($title) . ' · Tremplin</title><style>'
        . ':root{--b:#0057ff;--n:#0a1633}*{box-sizing:border-box}body{margin:0;font:16px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:linear-gradient(180deg,#eaf1ff,#f6f9ff 40%);color:#142144;min-height:100vh}'
        . '.w{max-width:560px;margin:0 auto;padding:32px 16px 60px}h1{font-size:1.65rem;line-height:1.2;margin:.3em 0 .2em;color:var(--n)}p.lead{color:#5a6788;margin:0 0 18px}'
        . '.card{background:#fff;border:1px solid #e4eaf5;border-radius:18px;padding:22px;margin:14px 0;box-shadow:0 16px 40px -28px rgba(0,40,120,.45)}.top{display:flex;align-items:center;gap:10px;font-weight:800;color:var(--b);font-size:1.05rem}'
        . '.top i{display:inline-grid;place-items:center;width:34px;height:34px;border-radius:10px;background:var(--b);color:#fff;font-style:normal}'
        . 'label{display:block;font-weight:600;margin:14px 0 5px;font-size:.92rem}input,select{width:100%;padding:12px 13px;border:1px solid #cfd8ea;border-radius:11px;font:inherit;background:#fff}'
        . 'input:focus,select:focus{outline:3px solid #dde9ff;border-color:var(--b)}.row{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(180px,1fr))}.hint{font-size:.82rem;color:#5a6788;margin-top:4px}'
        . '.btn{display:block;width:100%;margin-top:20px;padding:14px 22px;border:0;border-radius:13px;background:var(--b);color:#fff;font:700 1.05rem system-ui,sans-serif;cursor:pointer;text-align:center;text-decoration:none}'
        . '.btn:hover{background:#0047d6}.ok{color:#0d7a3f}.ko{color:#c01d24}.err{background:#fdecec;border:1px solid #f5c2c4;border-radius:12px;padding:12px 14px}.err ul{margin:.3em 0 0;padding-left:1.2em}'
        . '.succ{background:#e8f8ef;border:1px solid #b9e8cc;border-radius:12px;padding:12px 14px}ul.checks{list-style:none;padding:0;margin:0;font-size:.92rem}ul.checks li{padding:3px 0}'
        . 'code{background:#eef2f9;padding:1px 6px;border-radius:6px}details{margin-top:14px}summary{cursor:pointer;font-weight:600;color:var(--b)}'
        . '.check{display:flex;gap:10px;align-items:flex-start;font-weight:500;margin-top:12px}.check input{width:auto;margin-top:5px}.steps{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 0;padding:0;list-style:none;font-size:.85rem;color:#5a6788}'
        . '.steps li{background:#fff;border:1px solid #e4eaf5;border-radius:99px;padding:4px 12px}'
        . '</style></head><body><div class="w"><div class="top"><i>◆</i> Tremplin by NEAM</div>' . $body . '</div></body></html>';
    exit;
}

/* ---------- Déjà installé ---------- */
if (is_file($lock)) {
    http_response_code(403);
    page('Déjà installé', '<h1>La plateforme est déjà installée</h1><div class="card"><p>Par sécurité, l\'assistant est désactivé. '
        . 'Supprimez le fichier <code>public/install.php</code> s\'il est encore présent.</p>'
        . '<p class="hint">Réinstaller (efface toutes les données) : supprimez <code>storage/installed.lock</code> et le fichier <code>.env</code>, puis rouvrez cette page.</p><a class="btn" href="./">Ouvrir la plateforme</a></div>');
}

/* ---------- Prérequis ---------- */
foreach (['uploads', 'logs', 'cache'] as $d) {
    if (!is_dir("$storage/$d")) {
        @mkdir("$storage/$d", 0775, true);
    }
}
$hasMysql = extension_loaded('pdo_mysql');
$hasSqlite = extension_loaded('pdo_sqlite');
$checks = [
    ['PHP 8.2 ou plus récent (actuel : ' . PHP_VERSION . ')', version_compare(PHP_VERSION, '8.2.0', '>='), true],
    ['Base de données disponible (SQLite intégrée ou MySQL)', $hasSqlite || $hasMysql, true],
    ['Extension mbstring', extension_loaded('mbstring'), true],
    ['Extension fileinfo (contrôle des fichiers envoyés)', extension_loaded('fileinfo'), true],
    ['Extension GD (photos, QR code, PDF)', extension_loaded('gd'), true],
    ['Extension cURL (Claude, catalogues de formations)', extension_loaded('curl'), false],
    ['Extension zip (import des CV Word)', extension_loaded('zip'), false],
    ['Bibliothèques incluses (dossier vendor/)', is_file($base . '/vendor/autoload.php'), true],
    ['Dossier storage/ accessible en écriture', is_writable($storage), true],
    ['Dossier principal accessible en écriture (fichier .env)', is_writable($base) || (is_file($base . '/.env') && is_writable($base . '/.env')), true],
];
$blocking = array_filter($checks, fn($c) => $c[2] && !$c[1]);
$checkHtml = '<ul class="checks">' . implode('', array_map(fn($c) => '<li class="' . ($c[1] ? 'ok' : ($c[2] ? 'ko' : '')) . '">' . ($c[1] ? '✔' : ($c[2] ? '✖' : '–')) . ' ' . h($c[0]) . '</li>', $checks)) . '</ul>';
if ($blocking) {
    page('Prérequis', '<h1>Encore un réglage côté hébergeur</h1><div class="card">' . $checkHtml
        . '<div class="err" style="margin-top:14px">Sur LWS : <b>Panel LWS › votre formule › Configuration PHP</b>, choisissez PHP 8.3, patientez 15 à 20 minutes, puis rechargez cette page. '
        . 'Vérifiez aussi que l\'archive a été décompressée en entier (dossier <code>vendor/</code> compris).</div></div>');
}

/* ---------- Preuve de propriété ---------- */
// La clé livrée avec l'archive (dans le lien d'installation) suffit ; sinon, code à lire dans storage/install-code.txt
$shippedKey = is_file($keyFile) ? trim((string)file_get_contents($keyFile)) : '';
if ($shippedKey === '' && !is_file($codeFile)) {
    @file_put_contents($codeFile, strtoupper(substr(bin2hex(random_bytes(6)), 0, 10)) . "\n");
}
$fileCode = is_file($codeFile) ? trim((string)file_get_contents($codeFile)) : '';
$given = trim((string)($_POST['cle'] ?? $_GET['cle'] ?? ''));
$authorized = ($shippedKey !== '' && hash_equals($shippedKey, $given)) || ($fileCode !== '' && hash_equals($fileCode, strtoupper($given)));

$host = $_SERVER['HTTP_HOST'] ?? 'localhost';
$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
$dir = preg_replace('#/public$#', '', rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/')), '/'));
$f = $_POST + [
    'admin_first' => '', 'admin_last' => '', 'admin_email' => '', 'admin_password' => '', 'db_driver' => $hasSqlite ? 'sqlite' : 'mysql',
    'db_host' => 'localhost', 'db_port' => '3306', 'db_name' => '', 'db_user' => '', 'db_password' => '', 'demo' => '', 'anthropic_key' => '',
    'mail_host' => '', 'mail_port' => '465', 'mail_user' => 'contact@neamindustry.com', 'mail_password' => '',
    'app_url' => ($https ? 'https://' : 'http://') . $host . $dir,
];
$errors = [];

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    if (!$authorized) {
        $errors[] = 'Clé d\'installation invalide. Utilisez le lien d\'installation fourni avec l\'archive, ou recopiez le code du fichier storage/install-code.txt.';
    }
    if (!filter_var($f['app_url'], FILTER_VALIDATE_URL)) {
        $errors[] = 'Adresse du site invalide.';
    }
    if (trim((string)$f['admin_first']) === '' || trim((string)$f['admin_last']) === '') {
        $errors[] = 'Indiquez votre prénom et votre nom.';
    }
    if (!filter_var($f['admin_email'], FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'Adresse e-mail invalide.';
    }
    if (mb_strlen((string)$f['admin_password']) < 10) {
        $errors[] = 'Mot de passe : 10 caractères au minimum.';
    }
    $driver = $f['db_driver'] === 'mysql' || !$hasSqlite ? 'mysql' : 'sqlite';
    if (!$errors && $driver === 'mysql') {
        try {
            $pdo = new PDO('mysql:host=' . $f['db_host'] . ';port=' . (int)$f['db_port'] . ';dbname=' . $f['db_name'] . ';charset=utf8mb4', (string)$f['db_user'], (string)$f['db_password'],
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 8]);
            if ($pdo->query("SHOW TABLES LIKE 'users'")->fetchColumn()) {
                $errors[] = 'Cette base MySQL contient déjà une installation de Tremplin : utilisez une base vide.';
            }
        } catch (Throwable $e) {
            $errors[] = 'Connexion MySQL impossible : ' . $e->getMessage() . ' — recopiez l\'hôte, le nom de la base, l\'utilisateur et le mot de passe du Panel LWS (MySQL & phpMyAdmin), ou choisissez la base intégrée.';
        }
    }
    if (!$errors) {
        $q = fn($v) => '"' . str_replace(['\\', '"', "\n", "\r"], ['\\\\', '\\"', '', ''], (string)$v) . '"';
        $url = rtrim((string)$f['app_url'], '/');
        $env = [
            '# Configuration générée par l\'installation express le ' . date('d/m/Y H:i') . ' — modifiable à tout moment',
            'APP_NAME="Tremplin by NEAM"', 'APP_URL=' . $q($url), 'APP_DEBUG=false', 'APP_DEMO=' . ($f['demo'] ? 'true' : 'false'),
            'APP_TIMEZONE=Africa/Libreville', 'APP_KEY=' . bin2hex(random_bytes(32)), '', 'DB_DRIVER=' . $driver,
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
            $errors[] = 'Impossible d\'écrire le fichier .env : donnez les droits d\'écriture (755) au dossier du site, puis réessayez.';
        } else {
            @chmod($base . '/.env', 0640);
            try {
                require $base . '/app/bootstrap.php';
                require $base . '/database/Migrator.php';
                @set_time_limit(300);
                if ($driver === 'sqlite') {
                    @unlink($storage . '/database.sqlite');
                }
                Database\Migrator::install((bool)$f['demo'], false);
                $now = date('Y-m-d H:i:s');
                $email = strtolower(trim((string)$f['admin_email']));
                $hash = password_hash((string)$f['admin_password'], PASSWORD_DEFAULT);
                $adminId = App\Core\DB::value('SELECT id FROM users WHERE email = :e', ['e' => $email]);
                if ($adminId) {
                    App\Core\DB::update('users', ['role' => 'admin', 'password_hash' => $hash, 'status' => 'active'], 'id = :id', ['id' => $adminId]);
                } else {
                    $adminId = App\Core\DB::insert('users', [
                        'role' => 'admin', 'email' => $email, 'password_hash' => $hash, 'first_name' => trim((string)$f['admin_first']), 'last_name' => trim((string)$f['admin_last']),
                        'status' => 'active', 'plan_code' => 'FREE', 'email_verified_at' => $now, 'created_at' => $now, 'updated_at' => $now,
                    ]);
                }
                if ($f['demo']) {
                    // Le compte administrateur de démonstration ne doit jamais rester accessible avec un mot de passe public
                    App\Core\DB::update('users', ['password_hash' => password_hash(bin2hex(random_bytes(16)), PASSWORD_DEFAULT), 'status' => 'suspended'], "email = 'admin@tremplin.ga'", []);
                }
                App\Core\DB::run('DELETE FROM settings WHERE skey = :k', ['k' => 'schema_version']);
                App\Core\DB::insert('settings', ['skey' => 'schema_version', 'svalue' => APP_VERSION]);
                // HTTPS : si l'installation se fait déjà en https, on force la redirection pour tout le site
                if ($https && is_file($base . '/.htaccess')) {
                    $ht = (string)file_get_contents($base . '/.htaccess');
                    $ht = str_replace(["# RewriteCond %{HTTPS} !=on", "# RewriteCond %{HTTP:X-Forwarded-Proto} !=https", "# RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]"],
                        ["RewriteCond %{HTTPS} !=on", "RewriteCond %{HTTP:X-Forwarded-Proto} !=https", "RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]"], $ht);
                    @file_put_contents($base . '/.htaccess', $ht);
                }
                file_put_contents($lock, date('c') . " (installation express)\n");
                @unlink($codeFile);
                @unlink($keyFile);
                // Connexion directe de l'administrateur : la plateforme est prête à l'emploi
                App\Core\Session::start();
                App\Core\Auth::login(App\Core\DB::one('SELECT * FROM users WHERE id = :id', ['id' => $adminId]));
                $selfDeleted = @unlink(__FILE__);
                page('C\'est en ligne', '<h1>C\'est en ligne ! 🎉</h1><p class="lead">Tremplin est installé et vous êtes connecté·e en tant qu\'administrateur.</p><div class="card"><div class="succ">'
                    . '<b>Prêt à l\'emploi :</b> 311 formations, 60 certifications, 59 compétences, 21 villes, conseils carrière et 17 modèles de CV'
                    . ($f['demo'] ? ', plus des données de démonstration (comptes candidat, recruteur et école : mot de passe <code>Tremplin2026!</code>)' : '') . '.</div>'
                    . '<ul class="checks" style="margin-top:14px">'
                    . '<li class="ok">✔ Base de données ' . ($driver === 'sqlite' ? 'intégrée créée (aucun réglage nécessaire)' : 'MySQL créée') . '</li>'
                    . '<li class="ok">✔ Compte administrateur : ' . h($email) . '</li>'
                    . ($https ? '<li class="ok">✔ HTTPS forcé sur tout le site</li>' : '<li>– Pensez à activer le certificat SSL gratuit dans le Panel LWS (voir le guide)</li>')
                    . ($selfDeleted ? '<li class="ok">✔ Assistant d\'installation supprimé</li>' : '<li class="ko">✖ Supprimez le fichier <code>public/install.php</code> (il est déjà verrouillé)</li>')
                    . '</ul><a class="btn" href="' . h($url) . '/admin">Ouvrir mon tableau de bord</a></div>');
            } catch (Throwable $e) {
                @unlink($base . '/.env');
                $errors[] = 'Erreur pendant la création de la base : ' . $e->getMessage();
            }
        }
    }
}

/* ---------- Formulaire ---------- */
if (!$authorized && ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
    page('Installation', '<h1>Installer Tremplin</h1><p class="lead">Ouvrez le <b>lien d\'installation</b> fourni avec l\'archive (il contient votre clé), ou saisissez le code du fichier <code>storage/install-code.txt</code>.</p>'
        . '<form method="get" class="card"><label for="cle">Clé ou code d\'installation</label><input id="cle" name="cle" required autocomplete="off"><button class="btn" type="submit">Continuer</button></form>');
}
$err = $errors ? '<div class="err"><b>À corriger :</b><ul>' . implode('', array_map(fn($e) => '<li>' . h($e) . '</li>', $errors)) . '</ul></div>' : '';
$sel = fn($a, $b) => $a === $b ? ' selected' : '';
page('Installation', '<h1>Installer Tremplin en une minute</h1><p class="lead">Créez votre compte administrateur : tout le reste est configuré automatiquement.</p>'
    . '<ul class="steps"><li>✔ Serveur compatible</li><li>✔ Clé vérifiée</li><li>➜ Votre compte</li></ul>' . $err
    . '<form method="post" class="card" autocomplete="off"><input type="hidden" name="cle" value="' . h($given) . '">'
    . '<div class="row"><div><label for="admin_first">Prénom</label><input id="admin_first" name="admin_first" required value="' . h($f['admin_first']) . '"></div>'
    . '<div><label for="admin_last">Nom</label><input id="admin_last" name="admin_last" required value="' . h($f['admin_last']) . '"></div></div>'
    . '<label for="admin_email">E-mail de connexion</label><input id="admin_email" name="admin_email" type="email" required value="' . h($f['admin_email']) . '">'
    . '<label for="admin_password">Mot de passe (10 caractères minimum)</label><input id="admin_password" name="admin_password" type="password" required minlength="10" autocomplete="new-password">'
    . '<button class="btn" type="submit">Installer et ouvrir la plateforme</button>'
    . '<details><summary>Options avancées (facultatif)</summary>'
    . '<label for="app_url">Adresse du site</label><input id="app_url" name="app_url" value="' . h($f['app_url']) . '"><div class="hint">Détectée automatiquement.</div>'
    . '<label for="db_driver">Base de données</label><select id="db_driver" name="db_driver">' . ($hasSqlite ? '<option value="sqlite"' . $sel($f['db_driver'], 'sqlite') . '>Base intégrée (recommandé pour démarrer : rien à créer)</option>' : '')
    . ($hasMysql ? '<option value="mysql"' . $sel($f['db_driver'], 'mysql') . '>MySQL (Panel LWS › MySQL & phpMyAdmin)</option>' : '') . '</select>'
    . '<div class="row"><div><label for="db_host">Hôte MySQL</label><input id="db_host" name="db_host" value="' . h($f['db_host']) . '"></div><div><label for="db_name">Nom de la base</label><input id="db_name" name="db_name" value="' . h($f['db_name']) . '"></div></div>'
    . '<div class="row"><div><label for="db_user">Utilisateur</label><input id="db_user" name="db_user" value="' . h($f['db_user']) . '"></div><div><label for="db_password">Mot de passe</label><input id="db_password" name="db_password" type="password" value="' . h($f['db_password']) . '"></div></div>'
    . '<input type="hidden" name="db_port" value="' . h($f['db_port']) . '">'
    . '<label for="anthropic_key">Clé API Claude</label><input id="anthropic_key" name="anthropic_key" value="' . h($f['anthropic_key']) . '" placeholder="sk-ant-…"><div class="hint">Sans clé, le moteur NEAM intégré rédige CV et lettres. La clé reste sur votre serveur.</div>'
    . '<div class="row"><div><label for="mail_host">Serveur SMTP (contact@neamindustry.com)</label><input id="mail_host" name="mail_host" value="' . h($f['mail_host']) . '"></div><div><label for="mail_password">Mot de passe SMTP</label><input id="mail_password" name="mail_password" type="password"></div></div>'
    . '<input type="hidden" name="mail_user" value="' . h($f['mail_user']) . '"><input type="hidden" name="mail_port" value="' . h($f['mail_port']) . '">'
    . '<label class="check"><input type="checkbox" name="demo" value="1"' . ($f['demo'] ? ' checked' : '') . '> <span>Ajouter des <b>données de démonstration</b> (entreprises, offres et candidats fictifs) — pour une présentation, pas pour le lancement public.</span></label>'
    . '</details></form>'
    . '<details class="card"><summary>Vérification du serveur</summary>' . $checkHtml . '</details>');
