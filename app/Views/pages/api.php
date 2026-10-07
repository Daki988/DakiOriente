<?php
$endpoints = [
    ['POST', '/api/v1/auth/register', 'Créer un compte candidat et obtenir un jeton', 'public'],
    ['POST', '/api/v1/auth/login', 'Obtenir un jeton d\'accès (Bearer)', 'public'],
    ['GET', '/api/v1/jobs', 'Rechercher des offres (q, city, sector, type, page)', 'public'],
    ['GET', '/api/v1/jobs/{id}', 'Détail d\'une offre (+ score si candidat authentifié)', 'public'],
    ['GET', '/api/v1/candidates/me', 'Profil du candidat connecté', 'candidat'],
    ['PATCH', '/api/v1/candidates/me', 'Mettre à jour le profil', 'candidat'],
    ['POST', '/api/v1/jobs/{id}/apply', 'Postuler à une offre', 'candidat'],
    ['GET', '/api/v1/matches', 'Scores de compatibilité détaillés', 'candidat'],
    ['GET', '/api/v1/recommendations', 'Offres et métiers recommandés', 'candidat'],
    ['POST', '/api/v1/cv/generate', 'Données structurées du CV', 'candidat'],
    ['POST', '/api/v1/cover-letter/generate', 'Générer une lettre de motivation', 'candidat'],
    ['POST', '/api/v1/interview/simulate', 'Questions d\'entretien et évaluation des réponses', 'candidat'],
    ['POST', '/api/v1/companies/jobs', 'Publier une offre', 'recruteur'],
    ['GET', '/api/v1/companies/candidates/search', 'Rechercher des candidats pour une offre', 'recruteur'],
    ['GET', '/api/v1/admin/analytics', 'Indicateurs globaux de la plateforme', 'admin'],
];
?>
<section class="section-sm">
    <div class="container" style="max-width:1000px">
        <span class="eyebrow">Développeurs & partenaires</span>
        <h1 style="font-size:2.2rem">API REST Tremplin v1</h1>
        <p class="muted">API-first, versionnée, JSON. Authentification par jeton Bearer. Spécification complète : <a href="<?= e(url('/api/v1/openapi.json')) ?>">OpenAPI 3.0 (openapi.json)</a>.</p>
        <div class="table-wrap mt-2">
            <table class="table">
                <thead><tr><th>Méthode</th><th>Endpoint</th><th>Description</th><th>Accès</th></tr></thead>
                <tbody>
                <?php foreach ($endpoints as [$m, $p, $d, $a]): ?>
                    <tr><td><span class="badge badge-<?= ['GET' => 'green', 'POST' => 'blue', 'PATCH' => 'amber'][$m] ?>"><?= $m ?></span></td><td><code class="kbd"><?= e($p) ?></code></td><td><?= e($d) ?></td><td><span class="badge badge-gray"><?= e($a) ?></span></td></tr>
                <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        <h2 class="mt-4" style="font-size:1.3rem">Exemple</h2>
<pre class="code">curl -X POST <?= e(url('/api/v1/auth/login')) ?> \
  -H "Content-Type: application/json" \
  -d '{"login":"candidat@tremplin.ga","password":"Tremplin2026!"}'

# → {"token":"…","user":{…}}

curl <?= e(url('/api/v1/matches')) ?> -H "Authorization: Bearer &lt;token&gt;"</pre>
        <p class="small muted">Limites : 120 requêtes/minute par IP. Les jetons expirent après 30 jours et peuvent être générés depuis <a href="<?= e(url('/compte/api')) ?>">ton compte</a>.</p>
    </div>
</section>
