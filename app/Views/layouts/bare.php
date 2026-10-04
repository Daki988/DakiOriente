<!doctype html>
<html lang="fr">
<head>
<?= App\Core\View::partial('partials/head', get_defined_vars()) ?>
</head>
<body style="background:#eef2f8">
<?= $content ?>
<script src="<?= e(asset('js/app.js')) ?>" defer></script>
</body>
</html>
