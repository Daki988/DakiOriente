<?php
declare(strict_types=1);

namespace App\Core;

/**
 * Validation des entrées. Exemple :
 *   $data = Validator::make($_POST, ['email' => 'required|email|unique:users,email'])->validateOrBack();
 */
final class Validator
{
    private array $errors = [];
    private array $clean = [];

    private const LABELS = [
        'email' => 'e-mail', 'password' => 'mot de passe', 'first_name' => 'prénom', 'last_name' => 'nom',
        'phone' => 'téléphone', 'title' => 'intitulé', 'name' => 'nom', 'description' => 'description',
    ];

    public function __construct(private array $input, private array $rules)
    {
    }

    public static function make(array $input, array $rules): self
    {
        $v = new self($input, $rules);
        $v->run();
        return $v;
    }

    private function run(): void
    {
        foreach ($this->rules as $field => $ruleString) {
            $value = $this->input[$field] ?? null;
            if (is_string($value)) {
                $value = trim($value);
            }
            $rules = explode('|', $ruleString);
            $nullable = in_array('nullable', $rules, true);
            if (($value === null || $value === '') && $nullable && !in_array('required', $rules, true)) {
                $this->clean[$field] = null;
                continue;
            }
            foreach ($rules as $rule) {
                [$name, $arg] = array_pad(explode(':', $rule, 2), 2, null);
                $error = $this->check($field, $name, $arg, $value);
                if ($error) {
                    $this->errors[$field] = $error;
                    break;
                }
            }
            $this->clean[$field] = $value;
        }
    }

    private function check(string $field, string $rule, ?string $arg, mixed $value): ?string
    {
        $label = self::LABELS[$field] ?? str_replace('_', ' ', $field);
        $len = is_string($value) ? mb_strlen($value) : 0;
        return match ($rule) {
            'required'  => ($value === null || $value === '' || $value === []) ? "Le champ « $label » est obligatoire." : null,
            'email'     => filter_var($value, FILTER_VALIDATE_EMAIL) ? null : "Adresse e-mail invalide.",
            'min'       => $len < (int)$arg ? "« " . ucfirst($label) . " » doit contenir au moins $arg caractères." : null,
            'max'       => $len > (int)$arg ? "« " . ucfirst($label) . " » ne doit pas dépasser $arg caractères." : null,
            'numeric'   => is_numeric($value) ? null : "« " . ucfirst($label) . " » doit être un nombre.",
            'integer'   => filter_var($value, FILTER_VALIDATE_INT) !== false ? null : "« " . ucfirst($label) . " » doit être un entier.",
            'between'   => (function () use ($arg, $value, $label) {
                [$a, $b] = explode(',', (string)$arg);
                return (is_numeric($value) && $value >= $a && $value <= $b) ? null : "« " . ucfirst($label) . " » doit être entre $a et $b.";
            })(),
            'in'        => in_array((string)$value, explode(',', (string)$arg), true) ? null : "Valeur invalide pour « $label ».",
            'date'      => strtotime((string)$value) !== false ? null : "Date invalide.",
            'url'       => filter_var($value, FILTER_VALIDATE_URL) && preg_match('#^https?://#i', (string)$value) ? null : "Lien invalide (doit commencer par http:// ou https://).",
            'phone'     => preg_match('/^\+?[0-9 ]{8,16}$/', (string)$value) ? null : "Numéro de téléphone invalide (ex. +241 77 12 34 56).",
            'confirmed' => ($value === ($this->input[$field . '_confirmation'] ?? null)) ? null : "La confirmation ne correspond pas.",
            'strong'    => (preg_match('/[A-Za-z]/', (string)$value) && preg_match('/\d/', (string)$value)) ? null : "Le mot de passe doit contenir des lettres et des chiffres.",
            'unique'    => (function () use ($arg, $value) {
                [$table, $col, $except] = array_pad(explode(',', (string)$arg), 3, null);
                $sql = "SELECT COUNT(*) FROM $table WHERE $col = :v" . ($except ? ' AND id != :x' : '');
                $p = ['v' => $value] + ($except ? ['x' => (int)$except] : []);
                return DB::value($sql, $p) > 0 ? "Cette valeur est déjà utilisée." : null;
            })(),
            'exists'    => (function () use ($arg, $value) {
                [$table, $col] = explode(',', (string)$arg);
                return DB::value("SELECT COUNT(*) FROM $table WHERE $col = :v", ['v' => $value]) > 0 ? null : "Valeur inconnue.";
            })(),
            default     => null,
        };
    }

    public function fails(): bool
    {
        return $this->errors !== [];
    }

    public function errors(): array
    {
        return $this->errors;
    }

    public function data(): array
    {
        return $this->clean;
    }

    public function validateOrBack(): array
    {
        if ($this->fails()) {
            Session::put('_errors', $this->errors);
            Session::put('_old', array_diff_key($this->input, array_flip(['password', 'password_confirmation', '_csrf'])));
            flash('error', 'Merci de corriger les champs signalés.');
            back();
        }
        return $this->clean;
    }
}
