<?php
declare(strict_types=1);

namespace App\Services\Cv;

use App\Core\DB;

/** CV en ligne : lien privé non répertorié, activable et révocable par le candidat, avec QR code imprimable sur le CV. */
final class CvShare
{
    public static function url(string $token): string
    {
        return url('/cv/' . $token);
    }

    public static function enable(int $uid): string
    {
        $token = (string)DB::value('SELECT cv_share_token FROM candidate_profiles WHERE user_id = :u', ['u' => $uid]);
        if ($token === '') {
            $token = bin2hex(random_bytes(12));
        }
        DB::update('candidate_profiles', ['cv_share_token' => $token, 'cv_public' => 1], 'user_id = :u', ['u' => $uid]);
        return $token;
    }

    public static function disable(int $uid): void
    {
        DB::update('candidate_profiles', ['cv_public' => 0], 'user_id = :u', ['u' => $uid]);
    }

    /** Nouveau lien : l'ancien cesse de fonctionner (QR codes déjà imprimés compris). */
    public static function regenerate(int $uid): string
    {
        $token = bin2hex(random_bytes(12));
        DB::update('candidate_profiles', ['cv_share_token' => $token, 'cv_public' => 1], 'user_id = :u', ['u' => $uid]);
        return $token;
    }

    public static function findUser(string $token): ?int
    {
        if (!preg_match('/^[a-f0-9]{24}$/', $token)) {
            return null;
        }
        $id = DB::value('SELECT user_id FROM candidate_profiles WHERE cv_share_token = :t AND cv_public = 1', ['t' => $token]);
        return $id ? (int)$id : null;
    }

    /** QR code PNG en data URI (vide si la bibliothèque n'est pas installée). */
    public static function qr(string $token): ?string
    {
        if (!class_exists(\chillerlan\QRCode\QRCode::class) || !function_exists('imagecreatetruecolor')) {
            return null;
        }
        $options = new \chillerlan\QRCode\QROptions([
            'outputInterface' => \chillerlan\QRCode\Output\QRGdImagePNG::class,
            'outputBase64' => true, 'scale' => 6, 'quietzoneSize' => 1,
            'eccLevel' => \chillerlan\QRCode\Common\EccLevel::M,
        ]);
        return (new \chillerlan\QRCode\QRCode($options))->render(self::url($token));
    }
}
