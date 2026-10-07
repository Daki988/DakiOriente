<?php
declare(strict_types=1);

namespace App\Services\Cv;

use App\Core\View;

/**
 * Rendu du CV : un seul gabarit (app/Views/cv/sheet.php) et une seule feuille de style (public/assets/css/cv.css)
 * pour l'aperçu à l'écran et pour le PDF. En mode PDF, les variables CSS sont remplacées par leurs valeurs
 * (dompdf ne les gère pas) et la photo est intégrée en data URI.
 */
final class CvRenderer
{
    private const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    /** Lignes disponibles dans la colonne latérale par densité (estimation pour la répartition automatique). */
    private const SIDE_CAPACITY = ['aere' => 50, 'normal' => 56, 'compact' => 64, 'serre' => 72];

    /** Données prêtes à afficher, communes à tous les modèles. */
    public static function data(array $p, array $s, string $mode = 'web'): array
    {
        $ai = $p['cv_ai_data'] ?? null;
        $tech = array_values(array_filter($p['skills'] ?? [], fn($x) => ($x['category'] ?? 'tech') !== 'soft'));
        $softFromSkills = array_column(array_filter($p['skills'] ?? [], fn($x) => ($x['category'] ?? '') === 'soft'), 'name');
        $soft = array_values(array_unique(array_merge($p['soft_list'] ?? [], $softFromSkills)));
        $contact = array_values(array_filter([
            ['phone', $p['phone'] ?? null], ['email', $p['email'] ?? null],
            ['city', trim(($p['city_name'] ?? '') . (!empty($p['country_name']) && !empty($p['city_name']) ? ', ' . $p['country_name'] : ''))],
            ['linkedin', !empty($p['linkedin']) ? preg_replace('#^https?://(www\.)?#', '', rtrim((string)$p['linkedin'], '/')) : null],
            ['web', !empty($p['portfolio']) ? preg_replace('#^https?://(www\.)?#', '', rtrim((string)$p['portfolio'], '/')) : null],
        ], fn($c) => !empty($c[1])));
        $experiences = [];
        foreach ($p['experiences'] ?? [] as $x) {
            $bullets = !empty($ai['experiences'][$x['id']]) ? self::structure(array_map(fn($b) => '- ' . $b, $ai['experiences'][$x['id']])) : null;
            if (!$bullets && !empty($x['description'])) {
                // Les descriptions saisies sur plusieurs lignes deviennent des puces (et sous-titres)
                $lines = array_values(array_filter(array_map('trim', preg_split('/\R/u', (string)$x['description']))));
                $bullets = count($lines) > 1 ? self::structure($lines) : null;
            }
            $experiences[] = [
                'id' => (int)$x['id'], 'title' => $x['title'], 'org' => $x['company'] ?? '', 'place' => $x['city'] ?? '',
                'period' => self::period($x['start_date'] ?? null, $x['end_date'] ?? null), 'kind' => $x['kind'] ?? '',
                'bullets' => $bullets, 'text' => $bullets ? null : trim((string)($x['description'] ?? '')),
            ];
        }
        $educations = array_map(fn($e) => [
            'degree' => $e['degree'], 'field' => $e['field'] ?? '', 'school' => $e['school'],
            'period' => trim(($e['start_year'] ? $e['start_year'] . ' – ' : '') . ($e['end_year'] ?? '')), 'text' => trim((string)($e['description'] ?? '')),
        ], $p['educations'] ?? []);
        $langs = array_values(array_filter($p['languages_list'] ?? [], fn($l) => !empty($l['name'])));
        $certs = array_map(fn($c) => ['title' => $c['title'], 'issuer' => $c['issuer'] ?? '', 'year' => !empty($c['issued_at']) ? substr((string)$c['issued_at'], 0, 4) : '', 'verified' => ($c['status'] ?? '') === 'verifie'], $p['certificates'] ?? []);
        $extraCerts = trim((string)($p['certifications'] ?? ''));
        $interests = array_values(array_filter(array_map('trim', preg_split('/[,;\n]/u', (string)($p['interests'] ?? '')))));
        $availability = null;
        if (!empty($p['availability_date']) || !empty($p['mobility'])) {
            $availability = trim((!empty($p['availability_date']) && $p['availability_date'] > date('Y-m-d') ? 'Disponible à partir du ' . date_fr($p['availability_date']) : 'Disponible immédiatement')
                . (!empty($p['mobility']) ? ' · Mobilité : ' . (mobility_labels()[$p['mobility']] ?? $p['mobility']) : ''));
        }
        $sec = $s['sections'];
        return [
            'name' => trim(($p['first_name'] ?? '') . ' ' . ($p['last_name'] ?? '')),
            'first' => (string)($p['first_name'] ?? ''), 'last' => (string)($p['last_name'] ?? ''),
            'headline' => trim((string)(($ai['headline'] ?? '') ?: ($p['headline'] ?? ''))),
            'summary' => trim((string)(($ai['summary'] ?? '') ?: ($p['bio'] ?? ''))),
            'contact' => $contact,
            'skills' => array_slice($tech, 0, max(4, $s['max_skills'])),
            'soft' => $sec['qualities'] ? array_slice($soft, 0, 8) : [],
            'langs' => $sec['languages'] ? $langs : [],
            'experiences' => $experiences,
            'educations' => $educations,
            'certs' => $sec['certifications'] ? $certs : [],
            'extra_certs' => $sec['certifications'] ? $extraCerts : '',
            'interests' => $sec['interests'] ? $interests : [],
            'availability' => $sec['availability'] ? $availability : null,
            'references' => !empty($sec['references']),
            'photo' => $s['show_photo'] ? CvPhoto::src((int)$p['photo_document_id'], $mode === 'pdf') : null,
            'qr' => !empty($sec['qr']) && !empty($p['cv_public']) && !empty($p['cv_share_token']) ? CvShare::qr((string)$p['cv_share_token']) : null,
            'initials' => initials($p['first_name'] ?? '', $p['last_name'] ?? ''),
        ];
    }

    /**
     * Lignes de description → éléments affichables :
     *  - « Direction générale : » (ligne sans tiret terminée par deux-points) → sous-titre ;
     *  - « Procédures douanières : codification… » → puce dont l'intitulé est mis en gras.
     * @return list<array{t:string, lead:?string, text:string}>
     */
    public static function structure(array $lines): array
    {
        $out = [];
        foreach ($lines as $raw) {
            $l = trim((string)$raw);
            $dash = (bool)preg_match('/^[-•*–·]\s*/u', $l);
            $l = trim(preg_replace('/^[-•*–·]\s*/u', '', $l));
            if ($l === '') {
                continue;
            }
            if (!$dash && preg_match('/^(.{2,70}?)\s*:$/u', $l, $m)) {
                $out[] = ['t' => 'sub', 'lead' => null, 'text' => $m[1]];
                continue;
            }
            if (preg_match('/^([^:.;!?]{3,60}?)\s*:\s+(\S.*)$/u', $l, $m)) {
                $out[] = ['t' => 'li', 'lead' => $m[1], 'text' => $m[2]];
            } else {
                $out[] = ['t' => 'li', 'lead' => null, 'text' => $l];
            }
        }
        return $out;
    }

    /** « janv. 2024 – aujourd'hui » */
    public static function period(?string $start, ?string $end): string
    {
        $f = fn($d) => $d ? self::MONTHS[(int)date('n', strtotime($d)) - 1] . ' ' . date('Y', strtotime($d)) : '';
        $a = $f($start);
        $b = $end ? $f($end) : 'aujourd\'hui';
        return $a ? $a . ' – ' . $b : ($end ? $b : '');
    }

    /** Densité effective : réglage du candidat, ou celle calculée par l'ajustement automatique du PDF. */
    public static function density(array $p, array $s): string
    {
        if ($s['density'] !== 'auto') {
            return $s['density'];
        }
        $saved = json_decode((string)($p['cv_settings'] ?? ''), true) ?: [];
        $t = CvTemplates::get($s['template']);
        return $saved['auto_density'][$s['template']] ?? ($t['density'] ?? 'normal');
    }

    /**
     * Répartition des blocs de la colonne latérale. Ce qui ne tient pas sur la première page passe dans la colonne principale.
     * $moveCount : nombre de blocs à reporter, mesuré lors de la génération du PDF ; à défaut, estimation.
     * Retourne [blocs de la colonne latérale, blocs reportés].
     */
    public static function sideBlocks(array $d, string $density, bool $nameInSide, ?int $moveCount = null, ?array $order = null): array
    {
        $all = [
            'contact' => 2.4 + count($d['contact']) * 2.3,
            'edu' => $d['educations'] ? 2.4 + count($d['educations']) * 3.6 : 0,
            'skills' => $d['skills'] ? 2.4 + count($d['skills']) * 1.5 : 0,
            'langs' => $d['langs'] ? 2.4 + count($d['langs']) * 1.45 : 0,
            'soft' => $d['soft'] ? 2.4 + ceil(mb_strlen(implode(' · ', $d['soft'])) / 26) * 1.3 : 0,
            'interests' => $d['interests'] ? 2.4 + ceil(mb_strlen(implode(' · ', $d['interests'])) / 26) * 1.3 : 0,
            'qr' => $d['qr'] ? 8 : 0,
        ];
        $order ??= ['contact', 'skills', 'langs', 'soft', 'interests', 'qr'];
        $blocks = array_filter(array_intersect_key(array_replace(array_flip($order), $all), array_flip($order)));
        $keys = array_keys($blocks);
        if ($moveCount === null) {
            $used = ($d['photo'] ? 8 : 0) + ($nameInSide ? 2 + ceil(mb_strlen($d['name']) / 12) * 2.6 + ($d['headline'] ? ceil(mb_strlen($d['headline']) / 22) * 1.5 : 0) : 0);
            $cap = self::SIDE_CAPACITY[$density] ?? 56;
            $moveCount = 0;
            foreach ($blocks as $k => $h) {
                $used += $h;
                if ($used > $cap && $k !== 'contact') {
                    $moveCount = count($keys) - array_search($k, $keys, true);
                    break;
                }
            }
        }
        $moveCount = max(0, min(count($keys) - 1, $moveCount));
        return [array_slice($keys, 0, count($keys) - $moveCount), $moveCount ? array_slice($keys, -$moveCount) : []];
    }

    /** Nombre de blocs latéraux à reporter, mémorisé par la dernière génération du PDF. */
    public static function savedSideMoves(array $p, string $template): ?int
    {
        $saved = json_decode((string)($p['cv_settings'] ?? ''), true) ?: [];
        return isset($saved['auto_side'][$template]) ? (int)$saved['auto_side'][$template] : null;
    }

    /**
     * Feuille de CV complète (style + balisage).
     * $mode : web (aperçu interactif), pdf (dompdf), thumb (vignette de galerie).
     */
    public static function render(array $p, ?array $s = null, string $mode = 'web', ?string $density = null, ?int $sideMoves = null): string
    {
        $s ??= CvTemplates::settings($p);
        $t = CvTemplates::get($s['template']);
        $d = self::data($p, $s, $mode);
        $density ??= self::density($p, $s);
        $sideMoves ??= self::savedSideMoves($p, $t['key']);
        $html = View::partial('cv/sheet', ['d' => $d, 's' => $s, 't' => $t, 'mode' => $mode, 'density' => $density, 'sideMoves' => $sideMoves]);
        return $mode === 'pdf' ? $html : '<div class="cv-scope" style="' . e(self::vars($s)) . '">' . $html . '</div>';
    }

    /** Variables CSS de la palette et de la police (aperçu web). */
    public static function vars(array $s): string
    {
        $pal = CvTemplates::PALETTES[$s['palette']];
        $font = CvTemplates::FONTS[$s['font']];
        return "--cv-accent:{$pal['accent']};--cv-dark:{$pal['dark']};--cv-soft:{$pal['soft']};--cv-line:{$pal['line']};--cv-font:'{$font['family']}'";
    }

    /** CSS autonome pour le PDF : variables remplacées, polices chargées depuis le disque. */
    public static function pdfCss(array $s): string
    {
        $pal = CvTemplates::PALETTES[$s['palette']];
        $css = (string)file_get_contents(BASE_PATH . '/public/assets/css/cv.css');
        // Les règles réservées à l'écran sont retirées
        $css = preg_replace('#/\* web:start \*/.*?/\* web:end \*/#s', '', $css);
        $css = str_replace(['/* pdf:start', 'pdf:end */'], '', $css);
        $font = CvTemplates::FONTS[$s['font']];
        $dir = BASE_PATH . '/public/assets/fonts/cv/';
        $faces = '';
        foreach (CvTemplates::FONTS as $f) {
            $faces .= "@font-face{font-family:'{$f['family']}';src:url('{$dir}{$f['regular']}');font-weight:normal;font-style:normal}"
                . "@font-face{font-family:'{$f['family']}';src:url('{$dir}{$f['bold']}');font-weight:bold;font-style:normal}";
        }
        $css = preg_replace('#@font-face\s*\{[^}]*\}#', '', $css);
        return $faces . strtr($css, [
            'var(--cv-accent)' => $pal['accent'], 'var(--cv-dark)' => $pal['dark'], 'var(--cv-soft)' => $pal['soft'],
            'var(--cv-line)' => $pal['line'], 'var(--cv-font)' => "'{$font['family']}'",
        ]);
    }
}
