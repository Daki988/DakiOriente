# ADR 0002 — Spring Boot 4.1 au lieu de Spring Boot 3

Statut : proposé, à confirmer par le Ministère (16/10/2026)

## Contexte
La section 18 cite « Spring Boot 3 », par alignement sur le livrable SNGJ. La dernière version 3.x (3.5.16) date du 25/06/2026 : la branche 3.5 n'a plus de correctifs publics gratuits. SEC-14 exige l'application des correctifs critiques sous 72 heures.

## Décision
Utiliser Spring Boot 4.1 (Java 21, Spring Framework 7, Jackson 3), version maintenue à la date du développement.

## Conséquences
- Mêmes principes que le livrable SNGJ (Java 21, Spring, PostgreSQL, Keycloak) ; seule la version majeure change.
- Si le Ministère impose la branche 3.x, il faudra un contrat de support étendu auprès de l'éditeur de Spring.
