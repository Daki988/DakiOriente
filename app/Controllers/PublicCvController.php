<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\DB;
use App\Core\View;
use App\Services\Cv\CvPdf;
use App\Services\Cv\CvPhoto;
use App\Services\Cv\CvRenderer;
use App\Services\Cv\CvShare;
use App\Services\Cv\CvTemplates;
use App\Services\ProfileService;

/** CV en ligne partagé par lien privé (non répertorié par les moteurs de recherche) et photo signée. */
final class PublicCvController extends Controller
{
    public function photo(string $token): void
    {
        CvPhoto::serve($token);
    }

    public function show(string $token): string
    {
        $uid = CvShare::findUser($token) ?? abort(404);
        $p = ProfileService::load($uid, true);
        if (Auth::id() !== $uid) {
            DB::run('UPDATE candidate_profiles SET cv_views = cv_views + 1 WHERE user_id = :u', ['u' => $uid]);
        }
        header('X-Robots-Tag: noindex, nofollow');
        return View::render('pages/cv_public', [
            'html' => CvRenderer::render($p, CvTemplates::settings($p)), 'p' => $p, 'token' => $token, 'pdfReady' => CvPdf::available(),
            'title' => 'CV — ' . $p['first_name'] . ' ' . $p['last_name'],
        ], 'bare');
    }

    public function pdf(string $token): void
    {
        $uid = CvShare::findUser($token) ?? abort(404);
        $p = ProfileService::load($uid, true);
        if (!CvPdf::available()) {
            redirect('/cv/' . $token);
        }
        $r = CvPdf::build($p);
        CvPdf::send($r['pdf'], CvPdf::filename($p), true);
    }
}
