<?php
declare(strict_types=1);

namespace App\Services\Ai;

/**
 * Fournisseur Claude (Anthropic) via le SDK PHP officiel `anthropic-ai/sdk` (composer install).
 * Activé avec AI_PROVIDER=anthropic et ANTHROPIC_API_KEY dans .env (modèle : AI_MODEL, par défaut claude-opus-5-5).
 * En cas d'indisponibilité (SDK absent, erreur réseau, refus), retourne null → génération locale.
 */
final class AnthropicProvider implements AiProvider
{
    public function name(): string
    {
        return 'anthropic';
    }

    public static function available(): bool
    {
        return config('ai.api_key') !== '' && class_exists(\Anthropic\Client::class);
    }

    public function complete(string $system, string $prompt, int $maxTokens = 2000, string $effort = 'low'): ?string
    {
        if (!self::available()) {
            return null;
        }
        try {
            $client = new \Anthropic\Client(apiKey: (string)config('ai.api_key'), baseUrl: (string)config('ai.base_url'));
            $message = $client->messages->create(
                model: (string)config('ai.model'),
                // Marge pour la réflexion adaptative du modèle, en plus du texte attendu
                maxTokens: min(16000, $maxTokens + 6000),
                system: $system,
                outputConfig: ['effort' => in_array($effort, ['low', 'medium', 'high'], true) ? $effort : 'low'],
                messages: [
                    ['role' => 'user', 'content' => $prompt],
                ],
            );
            if ($message->stopReason === 'refusal') {
                return null;
            }
            $text = '';
            foreach ($message->content as $block) {
                if ($block->type === 'text') {
                    $text .= $block->text;
                }
            }
            return trim($text) !== '' ? trim($text) : null;
        } catch (\Anthropic\Core\Exceptions\APIStatusException $e) {
            error_log('[IA] Erreur API Claude : ' . ($e->type?->value ?? '') . ' ' . $e->getMessage());
            return null;
        } catch (\Throwable $e) {
            error_log('[IA] Claude indisponible : ' . $e->getMessage());
            return null;
        }
    }
}
