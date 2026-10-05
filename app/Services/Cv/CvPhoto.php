<?php
declare(strict_types=1);

namespace App\Services\Cv;

use App\Core\DB;
use App\Services\Uploader;

/**
 * Photo du CV : recadrée au carré, redimensionnée et réenregistrée en JPEG (les métadonnées, dont la localisation, disparaissent).
 * Servie par une URL signée (/photos/{id}-{signature}) affichée seulement aux personnes autorisées à voir le CV.
 */
final class CvPhoto
{
    private const SIZE = 600;

    public static function store(int $uid, array $file, array $crop = []): int
    {
        if (!function_exists('imagecreatetruecolor')) {
            throw new \RuntimeException('Le traitement des images n\'est pas disponible sur ce serveur (extension GD).');
        }
        $f = Uploader::store($file, Uploader::IMAGES);
        try {
            $src = match ($f['mime']) {
                'image/png' => @imagecreatefrompng($f['path']),
                'image/webp' => @imagecreatefromwebp($f['path']),
                default => @imagecreatefromjpeg($f['path']),
            };
            if (!$src) {
                throw new \RuntimeException('Image illisible : essaie un autre fichier JPG ou PNG.');
            }
            // Orientation des photos prises au téléphone
            if ($f['mime'] === 'image/jpeg' && function_exists('exif_read_data')) {
                $o = (int)(@exif_read_data($f['path'])['Orientation'] ?? 1);
                $src = match ($o) { 3 => imagerotate($src, 180, 0), 6 => imagerotate($src, -90, 0), 8 => imagerotate($src, 90, 0), default => $src };
            }
            $w = imagesx($src);
            $h = imagesy($src);
            if ($w < 160 || $h < 160) {
                throw new \RuntimeException('Photo trop petite : au moins 300 × 300 pixels pour un rendu net.');
            }
            // Recadrage carré : centré horizontalement, légèrement vers le haut (le visage est rarement au centre exact)
            $side = min($w, $h);
            $zoom = max(1.0, min(2.5, (float)($crop['zoom'] ?? 1)));
            $side = (int)round($side / $zoom);
            $cx = isset($crop['x']) ? (float)$crop['x'] : 0.5;
            $cy = isset($crop['y']) ? (float)$crop['y'] : ($h > $w ? 0.38 : 0.5);
            $x = (int)max(0, min($w - $side, round($cx * $w - $side / 2)));
            $y = (int)max(0, min($h - $side, round($cy * $h - $side / 2)));
            $out = imagecreatetruecolor(self::SIZE, self::SIZE);
            imagefill($out, 0, 0, imagecolorallocate($out, 255, 255, 255));
            imagecopyresampled($out, $src, 0, 0, $x, $y, self::SIZE, self::SIZE, $side, $side);
            $stored = bin2hex(random_bytes(16)) . '.jpg';
            imagejpeg($out, STORAGE_PATH . '/uploads/' . $stored, 86);
        } finally {
            @unlink($f['path']);
        }
        $old = DB::value('SELECT photo_document_id FROM candidate_profiles WHERE user_id = :u', ['u' => $uid]);
        $id = DB::insert('documents', ['user_id' => $uid, 'kind' => 'photo', 'original_name' => 'photo-cv.jpg', 'stored_name' => $stored, 'mime' => 'image/jpeg',
            'size' => (int)filesize(STORAGE_PATH . '/uploads/' . $stored), 'created_at' => now()]);
        DB::update('candidate_profiles', ['photo_document_id' => $id], 'user_id = :u', ['u' => $uid]);
        if ($old) {
            self::deleteDocument((int)$old, $uid);
        }
        return $id;
    }

    public static function remove(int $uid): void
    {
        $old = DB::value('SELECT photo_document_id FROM candidate_profiles WHERE user_id = :u', ['u' => $uid]);
        DB::update('candidate_profiles', ['photo_document_id' => null], 'user_id = :u', ['u' => $uid]);
        if ($old) {
            self::deleteDocument((int)$old, $uid);
        }
    }

    private static function deleteDocument(int $id, int $uid): void
    {
        $doc = DB::one("SELECT * FROM documents WHERE id = :id AND user_id = :u AND kind = 'photo'", ['id' => $id, 'u' => $uid]);
        if ($doc) {
            @unlink(STORAGE_PATH . '/uploads/' . basename($doc['stored_name']));
            DB::delete('documents', 'id = :id', ['id' => $id]);
        }
    }

    public static function signature(int $id): string
    {
        return substr(hash_hmac('sha256', 'photo:' . $id, app_secret()), 0, 20);
    }

    public static function path(int $id): ?string
    {
        $doc = DB::one("SELECT stored_name FROM documents WHERE id = :id AND kind = 'photo'", ['id' => $id]);
        $path = $doc ? STORAGE_PATH . '/uploads/' . basename($doc['stored_name']) : null;
        return $path && is_file($path) ? $path : null;
    }

    /** URL signée (écran) ou data URI (PDF). */
    public static function src(int $id, bool $inline = false): ?string
    {
        if (!$id) {
            return null;
        }
        if ($inline) {
            $path = self::path($id);
            return $path ? 'data:image/jpeg;base64,' . base64_encode((string)file_get_contents($path)) : null;
        }
        return url('/photos/' . $id . '-' . self::signature($id));
    }

    /** GET /photos/{token} */
    public static function serve(string $token): void
    {
        if (!preg_match('/^(\d+)-([a-f0-9]{20})$/', $token, $m) || !hash_equals(self::signature((int)$m[1]), $m[2]) || !($path = self::path((int)$m[1]))) {
            abort(404);
        }
        header('Content-Type: image/jpeg');
        header('Cache-Control: private, max-age=86400');
        header('X-Content-Type-Options: nosniff');
        header('Content-Length: ' . filesize($path));
        readfile($path);
        exit;
    }
}
