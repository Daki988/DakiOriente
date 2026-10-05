<?php
declare(strict_types=1);

namespace App\Services\Cv;

use App\Core\DB;

/**
 * Génération du CV en PDF (dompdf) : texte sélectionnable, polices intégrées, lisible par les logiciels de tri (ATS).
 * Mise en page automatique : en densité « auto », on resserre progressivement pour tenir sur une page
 * quand c'est possible sans nuire à la lisibilité ; sinon le CV passe proprement sur deux pages.
 */
final class CvPdf
{
    public static function available(): bool
    {
        return class_exists(\Dompdf\Dompdf::class);
    }

    /** Hauteur disponible pour la colonne latérale (pt) : 297 mm moins la marge haute (14 mm) et 6 mm de garde en bas. */
    private const PAGE_BOX = 841.89 - 39.69 - 17.0;

    /**
     * Ajustement automatique : pour chaque densité (de la plus aérée à la plus serrée), on reporte si besoin des blocs
     * de la colonne latérale dans la colonne principale jusqu'à ce que rien ne déborde, et on garde la première version
     * qui tient sur une page. Sinon : deux pages en densité lisible.
     * @return array{pdf:string, pages:int, density:string, side_moves:int, side_overflow:bool}
     */
    public static function build(array $p, ?array $s = null): array
    {
        $s ??= CvTemplates::settings($p);
        $layout = CvTemplates::get($s['template'])['layout'];
        $order = $s['density'] !== 'auto' ? [$s['density']] : ['normal', 'compact', 'serre'];
        $results = [];
        foreach ($order as $density) {
            $r = self::fitSide($p, $s, $density, $layout);
            $results[] = $r;
            if ($r['pages'] <= 1 && $s['density'] === 'auto') {
                if ($density === 'normal') {
                    $airy = self::fitSide($p, $s, 'aere', $layout);
                    $r = $airy['pages'] <= 1 && !$airy['side_overflow'] && $airy['side_moves'] <= $r['side_moves'] ? $airy : $r;
                }
                self::remember($p, $s['template'], $r);
                return $r;
            }
        }
        // Le parcours dépasse une page même resserré : deux pages lisibles plutôt qu'un texte minuscule
        $r = $s['density'] !== 'auto' ? $results[0] : ($results[0]['pages'] <= 2 ? $results[0] : $results[1]);
        self::remember($p, $s['template'], $r);
        return $r;
    }

    private static function fitSide(array $p, array $s, string $density, string $layout): array
    {
        $r = self::renderAt($p, $s, $density, $layout === 'side' ? 0 : null);
        for ($k = 1; $layout === 'side' && $r['side_overflow'] && $k <= 5; $k++) {
            $r = self::renderAt($p, $s, $density, $k);
        }
        return $r;
    }

    public static function renderAt(array $p, array $s, string $density, ?int $sideMoves = null): array
    {
        $tmp = STORAGE_PATH . '/cache/dompdf';
        if (!is_dir($tmp)) {
            @mkdir($tmp, 0775, true);
        }
        $o = new \Dompdf\Options();
        $o->setChroot([BASE_PATH . '/public/assets', $tmp]);
        $o->setFontDir($tmp);
        $o->setFontCache($tmp);
        $o->setTempDir($tmp);
        $o->setIsRemoteEnabled(false);
        $o->setIsPhpEnabled(false);
        $o->setIsFontSubsettingEnabled(true);
        $o->setDefaultFont('Helvetica');
        $o->setDpi(96);
        $dompdf = new \Dompdf\Dompdf($o);
        // Mesure de la colonne latérale (positionnée sur la première page) pour détecter un débordement
        $sideHeight = 0.0;
        $dompdf->setCallbacks([['event' => 'end_frame', 'f' => function ($frame) use (&$sideHeight) {
            $node = $frame->get_node();
            if ($node instanceof \DOMElement && str_contains(' ' . $node->getAttribute('class') . ' ', ' cv-side ')) {
                $box = $frame->get_border_box();
                $sideHeight = max($sideHeight, (float)$box['h'] + max(0.0, (float)$box['y'] - 39.69));
            }
        }]]);
        $name = trim(($p['first_name'] ?? '') . ' ' . ($p['last_name'] ?? ''));
        $html = '<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>CV — ' . e($name) . '</title><style>' . CvRenderer::pdfCss($s) . '</style></head><body>'
            . CvRenderer::render($p, $s, 'pdf', $density, $sideMoves) . '</body></html>';
        $dompdf->loadHtml($html, 'UTF-8');
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->addInfo('Title', 'CV — ' . $name);
        $dompdf->addInfo('Author', $name);
        $dompdf->addInfo('Creator', 'Tremplin by NEAM');
        $dompdf->render();
        return ['pdf' => (string)$dompdf->output(), 'pages' => $dompdf->getCanvas()->get_page_count(), 'density' => $density,
            'side_moves' => (int)$sideMoves, 'side_overflow' => $sideHeight > self::PAGE_BOX + 1];
    }

    private static function remember(array $p, string $template, array $r): void
    {
        if (empty($p['user_id'])) {
            return;
        }
        $saved = json_decode((string)(\App\Core\DB::value('SELECT cv_settings FROM candidate_profiles WHERE user_id = :u', ['u' => $p['user_id']]) ?? ''), true) ?: [];
        if (($saved['auto_density'][$template] ?? null) !== $r['density'] || ($saved['auto_side'][$template] ?? null) !== $r['side_moves']) {
            $saved['auto_density'][$template] = $r['density'];
            $saved['auto_side'][$template] = $r['side_moves'];
            DB::update('candidate_profiles', ['cv_settings' => json_encode($saved, JSON_UNESCAPED_UNICODE)], 'user_id = :u', ['u' => $p['user_id']]);
        }
    }

    public static function filename(array $p): string
    {
        return 'CV-' . trim(slugify(($p['first_name'] ?? '') . '-' . ($p['last_name'] ?? '')), '-') . '.pdf';
    }

    /** Envoi au navigateur : en pièce jointe (téléchargement) ou en ligne (aperçu). */
    public static function send(string $pdf, string $filename, bool $download): never
    {
        header('Content-Type: application/pdf');
        header('Content-Disposition: ' . ($download ? 'attachment' : 'inline') . '; filename="' . str_replace('"', '', $filename) . '"');
        header('Content-Length: ' . strlen($pdf));
        header('Cache-Control: private, no-store');
        header('X-Content-Type-Options: nosniff');
        echo $pdf;
        exit;
    }
}
