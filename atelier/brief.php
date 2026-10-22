<?php
/* =========================================================
   Atelier NEAM — Brief rempli par le client (lien personnel, sans compte)
   Le client décrit son entreprise en 5 minutes ; ses réponses alimentent
   directement son dossier dans l'Atelier, et l'équipe est prévenue par e-mail.
   ========================================================= */
declare(strict_types=1);

require __DIR__ . '/../api/mailer.php';
require __DIR__ . '/../api/lib/atelier/core.php';

header('X-Robots-Tag: noindex, nofollow');
header('Referrer-Policy: no-referrer');

$jeton = (string) ($_GET['t'] ?? '');
$client = null;
if (preg_match('/^[a-f0-9]{24}$/', $jeton)) {
    foreach (clients_tous() as $c) {
        if (hash_equals($c['jeton'] ?? '', $jeton)) {
            $client = $c;
            break;
        }
    }
}

$envoye = false;
$erreur = '';
if ($client && ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    // Limite : 5 envois par adresse IP sur 10 minutes ; champ piège pour les robots
    $f = sys_get_temp_dir() . '/neam_brief_' . md5($_SERVER['REMOTE_ADDR'] ?? '');
    $hits = array_filter(array_map('intval', explode(',', (string) @file_get_contents($f))), fn($t) => $t > time() - 600);
    if (count($hits) >= 5) {
        $erreur = 'Trop d’envois en peu de temps. Réessayez dans quelques minutes.';
    } elseif (empty($_POST['website'])) {
        $hits[] = time();
        @file_put_contents($f, implode(',', $hits), LOCK_EX);
        foreach (ATELIER_BRIEF as $k => [, $type]) {
            $v = trim((string) ($_POST[$k] ?? ''));
            if ($v === '') {
                continue;
            }
            $client['brief'][$k] = $type === 'number' ? (string) (float) str_replace([' ', ','], ['', '.'], $v) : clean($v, $type === 'text' ? 3000 : 200);
        }
        journal($client, 'Brief rempli par le client');
        client_enregistrer($client);
        $envoye = true;
        $dest = $CONFIG['audit']['notify_to'] ?? ($CONFIG['contact_to'] ?? []);
        if ($dest) {
            $nom = (string) ($client['brief']['entreprise'] ?? '');
            $lien = (isset($_SERVER['HTTP_HOST']) ? 'https://' . $_SERVER['HTTP_HOST'] : 'https://www.neamindustry.com') . '/atelier/?p=client&id=' . $client['id'];
            @send_mail($dest, 'Brief reçu : ' . $nom, email_layout('Brief reçu : ' . $nom, '<p>Le client vient de remplir son brief. Le dossier est prêt pour le diagnostic.</p><p><a href="' . h($lien) . '">Ouvrir le dossier dans l’Atelier</a></p>'), "Le client $nom vient de remplir son brief.\n$lien");
        }
    }
}
?><!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Votre brief · NEAM Softwares Industry</title>
<link rel="icon" href="../assets/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="atelier.css">
</head>
<body class="public">
<header class="top"><a href="https://www.neamindustry.com/" class="logo"><img src="../assets/logo-light.png" alt="NEAM Softwares Industry"></a></header>
<main class="wrap etroit">
<?php if (!$client): ?>
  <h1>Lien expiré ou incorrect</h1>
  <p>Ce lien ne correspond à aucun dossier. Écrivez-nous sur WhatsApp au <a href="https://wa.me/24177453167">077 45 31 67</a> : nous vous renvoyons le bon lien.</p>
<?php elseif ($envoye): ?>
  <h1>Merci, c’est bien reçu.</h1>
  <p>Nous préparons votre diagnostic à partir de vos réponses. Nous revenons vers vous sous 48 heures ouvrées maximum, sur WhatsApp ou par e-mail.</p>
  <p>Vous pouvez revenir sur ce lien à tout moment pour compléter vos réponses.</p>
<?php else: ?>
  <p class="label">Préparation de votre diagnostic</p>
  <h1><?= h($client['brief']['entreprise'] ?? 'Votre entreprise') ?> : parlez-nous de vous</h1>
  <p class="aide">5 minutes suffisent. Répondez avec vos mots : il n’y a pas de mauvaise réponse, et vous pouvez laisser vide ce que vous ne savez pas. Vos réponses servent uniquement à préparer votre diagnostic et vos contenus ; elles ne sont jamais partagées.</p>
  <?php if ($erreur): ?><p class="alerte"><?= h($erreur) ?></p><?php endif; ?>
  <form method="post" class="brief">
    <input type="text" name="website" class="piege" tabindex="-1" autocomplete="off" aria-hidden="true">
    <?php foreach (ATELIER_BRIEF as $k => [$label, $type, $aide]): $v = h($client['brief'][$k] ?? ''); ?>
      <label><?= h($label) ?>
        <?php if ($type === 'text'): ?>
          <textarea name="<?= $k ?>" rows="3" placeholder="<?= h($aide) ?>"><?= $v ?></textarea>
        <?php else: ?>
          <input name="<?= $k ?>" value="<?= $v ?>" placeholder="<?= h($aide) ?>"<?= $type === 'number' ? ' inputmode="decimal"' : ($k === 'email' ? ' type="email"' : '') ?>>
        <?php endif; ?>
      </label>
    <?php endforeach; ?>
    <button class="btn">Envoyer mes réponses</button>
  </form>
<?php endif; ?>
</main>
</body>
</html>
