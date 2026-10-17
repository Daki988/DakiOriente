# ADR 0003 — Journal d'audit chaîné

Statut : accepté (16/10/2026)

## Contexte
SEC-07 et ENF-12 : 100 % des actions journalisées, en écriture seule, chaînées cryptographiquement, conservées 10 ans hors de la base applicative.

## Décision
- Chaque entrée contient : qui, rôle, quoi, quand, objet, personne concernée, finalité, détails.
- Empreinte = SHA-256(empreinte précédente ‖ contenu canonique). La tête de chaîne est verrouillée (`SELECT … FOR UPDATE`) pour sérialiser les écritures.
- L'écriture a lieu dans la transaction de l'action : pas d'action sans trace.
- Un déclencheur PostgreSQL refuse toute modification ou suppression ; le rôle applicatif de production n'aura que `INSERT` et `SELECT`.
- `verifierIntegrite()` recalcule toute la chaîne et signale la première entrée altérée.

## Reste à faire
- Copie continue vers un stockage objet en écriture unique (WORM) hors de la base, avec horodatage qualifié périodique de la tête de chaîne.
