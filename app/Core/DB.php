<?php
declare(strict_types=1);

namespace App\Core;

use PDO;
use PDOStatement;

/**
 * Accès base de données (PDO, requêtes préparées uniquement).
 * SQLite par défaut (zéro configuration), MySQL/MariaDB ou PostgreSQL en production.
 */
final class DB
{
    private static ?PDO $pdo = null;

    public static function pdo(): PDO
    {
        if (self::$pdo === null) {
            $driver = config('db.driver');
            $opts = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];
            if ($driver === 'sqlite') {
                self::$pdo = new PDO('sqlite:' . config('db.path'), null, null, $opts);
                self::$pdo->exec('PRAGMA foreign_keys = ON');
                self::$pdo->exec('PRAGMA journal_mode = WAL');
            } elseif ($driver === 'pgsql') {
                $dsn = sprintf('pgsql:host=%s;port=%s;dbname=%s', config('db.host'), config('db.port'), config('db.name'));
                self::$pdo = new PDO($dsn, config('db.user'), config('db.password'), $opts);
            } else {
                $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', config('db.host'), config('db.port'), config('db.name'));
                self::$pdo = new PDO($dsn, config('db.user'), config('db.password'), $opts);
            }
        }
        return self::$pdo;
    }

    public static function driver(): string
    {
        return (string)config('db.driver');
    }

    public static function run(string $sql, array $params = []): PDOStatement
    {
        $stmt = self::pdo()->prepare($sql);
        foreach ($params as $k => $v) {
            $key = is_int($k) ? $k + 1 : (str_starts_with($k, ':') ? $k : ':' . $k);
            $type = is_int($v) ? PDO::PARAM_INT : (is_null($v) ? PDO::PARAM_NULL : (is_bool($v) ? PDO::PARAM_INT : PDO::PARAM_STR));
            $stmt->bindValue($key, is_bool($v) ? (int)$v : $v, $type);
        }
        $stmt->execute();
        return $stmt;
    }

    public static function all(string $sql, array $params = []): array
    {
        return self::run($sql, $params)->fetchAll();
    }

    public static function one(string $sql, array $params = []): ?array
    {
        $row = self::run($sql, $params)->fetch();
        return $row === false ? null : $row;
    }

    public static function value(string $sql, array $params = []): mixed
    {
        $v = self::run($sql, $params)->fetchColumn();
        return $v === false ? null : $v;
    }

    public static function column(string $sql, array $params = []): array
    {
        return self::run($sql, $params)->fetchAll(PDO::FETCH_COLUMN);
    }

    public static function insert(string $table, array $data): int
    {
        $cols = array_keys($data);
        $sql = sprintf(
            'INSERT INTO %s (%s) VALUES (%s)',
            $table,
            implode(', ', $cols),
            implode(', ', array_map(fn($c) => ':' . $c, $cols))
        );
        self::run($sql, $data);
        return (int)self::pdo()->lastInsertId();
    }

    public static function update(string $table, array $data, string $where, array $whereParams = []): int
    {
        $sets = [];
        $params = [];
        foreach ($data as $col => $val) {
            $sets[] = "$col = :set_$col";
            $params["set_$col"] = $val;
        }
        $sql = sprintf('UPDATE %s SET %s WHERE %s', $table, implode(', ', $sets), $where);
        return self::run($sql, array_merge($params, $whereParams))->rowCount();
    }

    public static function delete(string $table, string $where, array $params = []): int
    {
        return self::run("DELETE FROM $table WHERE $where", $params)->rowCount();
    }

    public static function transaction(callable $fn): mixed
    {
        $pdo = self::pdo();
        $pdo->beginTransaction();
        try {
            $result = $fn();
            $pdo->commit();
            return $result;
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    /** Placeholders IN (...) nommés pour une liste de valeurs. */
    public static function in(string $prefix, array $values): array
    {
        $keys = [];
        $params = [];
        foreach (array_values($values) as $i => $v) {
            $keys[] = ":{$prefix}{$i}";
            $params["{$prefix}{$i}"] = $v;
        }
        return [$keys ? implode(',', $keys) : 'NULL', $params];
    }

    /** Fragment SQL « année-mois » portable. */
    public static function yearMonth(string $col): string
    {
        return match (self::driver()) {
            'sqlite' => "strftime('%Y-%m', $col)",
            'pgsql'  => "to_char($col, 'YYYY-MM')",
            default  => "DATE_FORMAT($col, '%Y-%m')",
        };
    }
}
