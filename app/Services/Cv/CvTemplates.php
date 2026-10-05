<?php
declare(strict_types=1);

namespace App\Services\Cv;

/**
 * Catalogue des modèles de CV, palettes et polices.
 * Un même gabarit HTML/CSS sert à l'aperçu web et au PDF (dompdf) : pas de flexbox ni de grid dans la feuille de CV.
 */
final class CvTemplates
{
    /**
     * layout : side (colonne latérale), single (une colonne), label (titres de section dans une marge), header (bandeau + une colonne).
     * side : left|right pour les mises en page à colonne. photo : le modèle affiche la photo par défaut.
     */
    public const TEMPLATES = [
        'moderne'   => ['name' => 'Moderne', 'cat' => 'Moderne', 'layout' => 'side', 'side' => 'left', 'photo' => true, 'font' => 'poppins', 'palette' => 'tremplin',
            'desc' => 'Colonne foncée pour les contacts et compétences, contenu aéré à droite.', 'for' => 'Tous profils, tertiaire, numérique'],
        'horizon'   => ['name' => 'Horizon', 'cat' => 'Moderne', 'layout' => 'side', 'side' => 'right', 'photo' => true, 'font' => 'lato', 'palette' => 'marine',
            'desc' => 'Le parcours d\'abord, les atouts dans une colonne claire à droite.', 'for' => 'Commerce, gestion, administration'],
        'compact'   => ['name' => 'Compact', 'cat' => 'Moderne', 'layout' => 'side', 'side' => 'left', 'photo' => false, 'font' => 'fira', 'palette' => 'ardoise',
            'desc' => 'Dense et lisible pour faire tenir un parcours riche sur une page.', 'for' => 'Profils expérimentés'],
        'executif'  => ['name' => 'Exécutif', 'cat' => 'Professionnel', 'layout' => 'header', 'photo' => true, 'font' => 'lato', 'palette' => 'marine',
            'desc' => 'Bandeau sombre avec photo carrée : sobre et affirmé.', 'for' => 'Encadrement, finance, conseil'],
        'creatif'   => ['name' => 'Créatif', 'cat' => 'Créatif', 'layout' => 'header', 'photo' => true, 'font' => 'poppins', 'palette' => 'violet',
            'desc' => 'Bandeau coloré et titres en pastilles pour se démarquer.', 'for' => 'Communication, marketing, design'],
        'impact'    => ['name' => 'Impact', 'cat' => 'Créatif', 'layout' => 'single', 'photo' => false, 'font' => 'poppins', 'palette' => 'orange',
            'desc' => 'Nom en grand, liseré de couleur : on vous remarque en une seconde.', 'for' => 'Vente, événementiel, startups'],
        'douceur'   => ['name' => 'Douceur', 'cat' => 'Créatif', 'layout' => 'single', 'photo' => true, 'font' => 'lato', 'palette' => 'emeraude',
            'desc' => 'Sections en encadrés teintés, photo ronde, ton chaleureux.', 'for' => 'Santé, social, éducation, hôtellerie'],
        'classique' => ['name' => 'Classique', 'cat' => 'Classique', 'layout' => 'single', 'photo' => false, 'font' => 'lato', 'palette' => 'tremplin',
            'desc' => 'En-tête centré et filets fins : l\'intemporel qui rassure.', 'for' => 'Administration, secteur public'],
        'elegant'   => ['name' => 'Élégant', 'cat' => 'Classique', 'layout' => 'single', 'photo' => false, 'font' => 'serif', 'palette' => 'bordeaux',
            'desc' => 'Typographie à empattements et petites capitales, très soigné.', 'for' => 'Droit, luxe, hôtellerie haut de gamme'],
        'corporate' => ['name' => 'Corporate', 'cat' => 'Professionnel', 'layout' => 'label', 'photo' => false, 'font' => 'serif', 'palette' => 'marine',
            'desc' => 'Titres en marge, filet de couleur en tête : la rigueur des grands cabinets.', 'for' => 'Banque, audit, juridique'],
        'minimal'   => ['name' => 'Minimal', 'cat' => 'Professionnel', 'layout' => 'label', 'photo' => false, 'font' => 'fira', 'palette' => 'ardoise',
            'desc' => 'Beaucoup de blanc, une seule couleur, une lecture limpide.', 'for' => 'Ingénierie, informatique, recherche'],
        'chrono'    => ['name' => 'Chrono', 'cat' => 'Moderne', 'layout' => 'single', 'photo' => true, 'font' => 'fira', 'palette' => 'tremplin', 'timeline' => true,
            'desc' => 'Expériences sur une frise verticale : le parcours se lit d\'un coup d\'œil.', 'for' => 'Parcours variés, reconversions'],
        'premier'   => ['name' => 'Premier emploi', 'cat' => 'Étudiant', 'layout' => 'header', 'photo' => true, 'font' => 'poppins', 'palette' => 'emeraude', 'education_first' => true,
            'desc' => 'Formation et projets en premier, qualités mises en avant.', 'for' => 'Étudiants, jeunes diplômés, stages'],
        'ats'       => ['name' => 'ATS', 'cat' => 'Optimisé ATS', 'layout' => 'single', 'photo' => false, 'font' => 'fira', 'palette' => 'noir',
            'desc' => 'Une colonne, sans décor : lu sans erreur par les logiciels de tri des grandes entreprises.', 'for' => 'Grands groupes, multinationales, candidatures en ligne'],
    ];

    public const CATEGORIES = ['Moderne', 'Professionnel', 'Classique', 'Créatif', 'Étudiant', 'Optimisé ATS'];

    /** accent : couleur principale ; dark : variante foncée ; soft : fond teinté ; line : filets. */
    public const PALETTES = [
        'tremplin' => ['name' => 'Bleu Tremplin', 'accent' => '#0057ff', 'dark' => '#0b2a5b', 'soft' => '#eef3ff', 'line' => '#d6e2ff'],
        'marine'   => ['name' => 'Marine', 'accent' => '#1f4e8c', 'dark' => '#10223f', 'soft' => '#eef2f8', 'line' => '#d3deee'],
        'emeraude' => ['name' => 'Émeraude', 'accent' => '#0f8a6a', 'dark' => '#0b3f33', 'soft' => '#eaf6f2', 'line' => '#cbe8de'],
        'bordeaux' => ['name' => 'Bordeaux', 'accent' => '#9b2242', 'dark' => '#47101f', 'soft' => '#f8edf0', 'line' => '#ecd0d8'],
        'violet'   => ['name' => 'Violet', 'accent' => '#6d3fd1', 'dark' => '#2e1a63', 'soft' => '#f2edfc', 'line' => '#ddd2f6'],
        'orange'   => ['name' => 'Corail', 'accent' => '#d9480f', 'dark' => '#4f1d06', 'soft' => '#fdf0ea', 'line' => '#f6d6c7'],
        'ardoise'  => ['name' => 'Ardoise', 'accent' => '#3f5a78', 'dark' => '#1e293b', 'soft' => '#f1f4f8', 'line' => '#d9e0e9'],
        'or'       => ['name' => 'Or', 'accent' => '#a8761a', 'dark' => '#3b2a08', 'soft' => '#faf4e8', 'line' => '#efe0bf'],
        'noir'     => ['name' => 'Noir & blanc', 'accent' => '#222222', 'dark' => '#111111', 'soft' => '#f3f3f3', 'line' => '#d4d4d4'],
    ];

    /** Polices embarquées (sous-ensembles latins, licence OFL) : identiques à l'écran et dans le PDF. */
    public const FONTS = [
        'poppins' => ['name' => 'Poppins', 'family' => 'CvPoppins', 'regular' => 'poppins-regular.ttf', 'bold' => 'poppins-semibold.ttf', 'note' => 'Géométrique et moderne'],
        'lato'    => ['name' => 'Lato', 'family' => 'CvLato', 'regular' => 'lato-regular.ttf', 'bold' => 'lato-bold.ttf', 'note' => 'Neutre et chaleureuse'],
        'fira'    => ['name' => 'Fira Sans', 'family' => 'CvFira', 'regular' => 'firasans-regular.ttf', 'bold' => 'firasans-semibold.ttf', 'note' => 'Très lisible, idéale ATS'],
        'serif'   => ['name' => 'PT Serif', 'family' => 'CvSerif', 'regular' => 'pt-serif-regular.ttf', 'bold' => 'pt-serif-bold.ttf', 'note' => 'Classique à empattements'],
    ];

    public const DENSITIES = ['aere' => 'Aérée', 'normal' => 'Standard', 'compact' => 'Compacte', 'serre' => 'Très compacte'];

    /** Sections facultatives que le candidat peut afficher ou masquer. */
    public const SECTIONS = [
        'qualities' => 'Qualités', 'languages' => 'Langues', 'certifications' => 'Certifications', 'interests' => 'Centres d\'intérêt',
        'availability' => 'Disponibilité et mobilité', 'references' => 'Mention « Références sur demande »', 'qr' => 'QR code vers mon CV en ligne',
    ];

    public static function get(string $key): array
    {
        return (self::TEMPLATES[$key] ?? self::TEMPLATES['moderne']) + ['key' => isset(self::TEMPLATES[$key]) ? $key : 'moderne'];
    }

    /** Réglages du CV d'un candidat, complétés par les valeurs par défaut du modèle. */
    public static function settings(array $p, ?string $template = null): array
    {
        $saved = json_decode((string)($p['cv_settings'] ?? ''), true) ?: [];
        $key = $template ?? ($p['cv_template'] ?? 'moderne');
        $t = self::get($key);
        $s = [
            'template' => $t['key'],
            'palette' => $saved['palettes'][$t['key']] ?? $t['palette'],
            'font' => $saved['fonts'][$t['key']] ?? $t['font'],
            'density' => $saved['density'] ?? 'auto',
            'photo' => $saved['photo'] ?? null,
            'photo_shape' => $saved['photo_shape'] ?? 'round',
            'order' => $saved['order'] ?? 'auto',
            'sections' => ($saved['sections'] ?? []) + ['qualities' => true, 'languages' => true, 'certifications' => true, 'interests' => true, 'availability' => true, 'references' => false, 'qr' => false],
            'max_skills' => (int)($saved['max_skills'] ?? 10),
            'ignored' => $saved['ignored'] ?? [],
        ];
        if (!isset(self::PALETTES[$s['palette']])) {
            $s['palette'] = $t['palette'];
        }
        if (!isset(self::FONTS[$s['font']])) {
            $s['font'] = $t['font'];
        }
        // Photo : choix explicite du candidat, sinon selon le modèle (jamais sur le modèle ATS)
        $s['show_photo'] = $t['key'] !== 'ats' && !empty($p['photo_document_id']) && ($s['photo'] ?? $t['photo']);
        $s['education_first'] = $s['order'] === 'formation' || ($s['order'] === 'auto' && (!empty($t['education_first']) || (int)($p['experience_months'] ?? 0) < 6 && count($p['experiences'] ?? []) < 2));
        return $s;
    }

    /** Enregistre des réglages (fusion avec l'existant). Palette et police sont mémorisées par modèle. */
    public static function save(int $uid, array $current, array $changes): void
    {
        $saved = json_decode((string)($current['cv_settings'] ?? ''), true) ?: [];
        foreach ($changes as $k => $v) {
            if ($k === 'palette' || $k === 'font') {
                $saved[$k . 's'][$current['cv_template'] ?? 'moderne'] = $v;
            } elseif ($k === 'sections') {
                $saved['sections'] = $v + ($saved['sections'] ?? []);
            } else {
                $saved[$k] = $v;
            }
        }
        \App\Core\DB::update('candidate_profiles', ['cv_settings' => json_encode($saved, JSON_UNESCAPED_UNICODE)], 'user_id = :u', ['u' => $uid]);
    }
}
