<?php
declare(strict_types=1);

namespace App\Services;

/**
 * Upload sécurisé : contrôle de taille, extension ET type MIME réel (finfo), nom aléatoire,
 * stockage hors de la racine web (storage/uploads). Point d'extension pour un antivirus (ClamAV).
 */
final class Uploader
{
    public const DOCS = ['pdf' => 'application/pdf', 'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'txt' => 'text/plain'];
    public const IMAGES = ['jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp'];

    /** @return array{stored:string, original:string, mime:string, size:int, path:string} */
    public static function store(array $file, array $allowed): array
    {
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            throw new \RuntimeException('Aucun fichier reçu ou envoi interrompu.');
        }
        if ($file['size'] > config('upload.max_size')) {
            throw new \RuntimeException('Fichier trop volumineux (5 Mo maximum).');
        }
        $ext = strtolower(pathinfo((string)$file['name'], PATHINFO_EXTENSION));
        if (!isset($allowed[$ext])) {
            throw new \RuntimeException('Format non accepté. Formats autorisés : ' . implode(', ', array_keys($allowed)) . '.');
        }
        $mime = (new \finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']) ?: '';
        $okMimes = array_unique(array_values($allowed));
        $docxZip = $ext === 'docx' && in_array($mime, ['application/zip', 'application/octet-stream'], true);
        if (!in_array($mime, $okMimes, true) && !$docxZip) {
            throw new \RuntimeException('Le contenu du fichier ne correspond pas à son extension.');
        }
        if (!self::scan($file['tmp_name'])) {
            throw new \RuntimeException('Le fichier a été bloqué par l\'analyse de sécurité.');
        }
        $stored = bin2hex(random_bytes(16)) . '.' . $ext;
        $dest = STORAGE_PATH . '/uploads/' . $stored;
        if (!move_uploaded_file($file['tmp_name'], $dest) && !rename($file['tmp_name'], $dest)) {
            throw new \RuntimeException('Impossible d\'enregistrer le fichier.');
        }
        return ['stored' => $stored, 'original' => mb_substr(basename((string)$file['name']), 0, 200), 'mime' => $mime, 'size' => (int)$file['size'], 'path' => $dest];
    }

    /** Analyse antivirale : clamscan si présent, sinon heuristique minimale (contenu exécutable embarqué). */
    private static function scan(string $path): bool
    {
        $head = (string)file_get_contents($path, false, null, 0, 4096);
        if (preg_match('/<\?php|<script|MZ\x90\x00/i', $head)) {
            return false;
        }
        $clam = trim((string)@shell_exec('command -v clamscan 2>/dev/null'));
        if ($clam !== '') {
            exec(escapeshellcmd($clam) . ' --no-summary ' . escapeshellarg($path), $o, $code);
            return $code === 0;
        }
        return true;
    }

    /** Extraction de texte (CV importé) : PDF via pdftotext si disponible, DOCX via ZipArchive, TXT. */
    public static function extractText(string $path, string $ext): string
    {
        $ext = strtolower($ext);
        if ($ext === 'txt') {
            return (string)file_get_contents($path);
        }
        if ($ext === 'docx' && class_exists(\ZipArchive::class)) {
            $zip = new \ZipArchive();
            if ($zip->open($path) === true) {
                $xml = (string)$zip->getFromName('word/document.xml');
                $zip->close();
                $xml = preg_replace('#</w:p>#', "\n", $xml);
                return html_entity_decode(strip_tags((string)$xml), ENT_QUOTES | ENT_XML1, 'UTF-8');
            }
        }
        if ($ext === 'pdf') {
            $bin = trim((string)@shell_exec('command -v pdftotext 2>/dev/null'));
            if ($bin !== '') {
                return (string)shell_exec(escapeshellcmd($bin) . ' -layout ' . escapeshellarg($path) . ' - 2>/dev/null');
            }
            // Repli : chaînes lisibles des flux non compressés
            $raw = (string)file_get_contents($path);
            if (preg_match_all('/\((.*?)\)\s*Tj/s', $raw, $m)) {
                return implode(' ', $m[1]);
            }
        }
        return '';
    }
}
