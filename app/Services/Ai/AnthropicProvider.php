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

    /**
     * Recherche web côté serveur Anthropic, limitée aux domaines fournis.
     * Retourne le texte final de Claude et la liste brute des résultats de recherche (adresse, titre, âge de la page),
     * qui sert à contrôler que chaque offre citée existe bien dans les résultats.
     * @param list<string> $domains
     * @return array{text:string, results:list<array{url:string, title:string, page_age:?string}>, searches:int, error:?string}|null
     */
    public function searchWeb(string $system, string $prompt, array $domains, ?string $country = null, int $maxUses = 5, int $maxTokens = 4000): ?array
    {
        if (!self::available() || !$domains) {
            return null;
        }
        try {
            $client = new \Anthropic\Client(apiKey: (string)config('ai.api_key'), baseUrl: (string)config('ai.base_url'));
            $tool = \Anthropic\Messages\WebSearchTool20250305::with(
                allowedDomains: array_values($domains),
                maxUses: max(1, min(10, $maxUses)),
                userLocation: $country && preg_match('/^[A-Z]{2}$/', $country) ? \Anthropic\Messages\UserLocation::with(country: $country) : null,
            );
            $message = $client->messages->create(
                model: (string)config('ai.model'),
                maxTokens: min(16000, $maxTokens + 6000),
                system: $system,
                outputConfig: ['effort' => 'low'],
                tools: [$tool],
                messages: [['role' => 'user', 'content' => $prompt]],
            );
            if ($message->stopReason === 'refusal') {
                return null;
            }
            $text = '';
            $results = [];
            $searches = 0;
            $error = null;
            foreach ($message->content as $block) {
                if ($block->type === 'text') {
                    $text .= $block->text;
                } elseif ($block->type === 'server_tool_use') {
                    $searches++;
                } elseif ($block->type === 'web_search_tool_result') {
                    if (is_array($block->content)) {
                        foreach ($block->content as $r) {
                            $results[] = ['url' => (string)$r->url, 'title' => (string)$r->title, 'page_age' => $r->pageAge ?? null];
                        }
                    } else {
                        $error = (string)($block->content->errorCode ?? 'erreur');
                    }
                }
            }
            return ['text' => trim($text), 'results' => $results, 'searches' => $searches, 'error' => $error];
        } catch (\Anthropic\Core\Exceptions\APIStatusException $e) {
            error_log('[IA] Recherche web Claude : ' . ($e->type?->value ?? '') . ' ' . $e->getMessage());
            return ['text' => '', 'results' => [], 'searches' => 0, 'error' => 'api: ' . mb_substr($e->getMessage(), 0, 160)];
        } catch (\Throwable $e) {
            error_log('[IA] Recherche web indisponible : ' . $e->getMessage());
            return null;
        }
    }
}
