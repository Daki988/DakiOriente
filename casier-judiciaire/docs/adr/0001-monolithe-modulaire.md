# ADR 0001 — Service Casier en monolithe modulaire

Statut : accepté (16/10/2026)

## Contexte
Section 18 : « Java 21, Spring Boot, modules aux frontières strictes ; découpable en services plus tard ». ARC-02 interdit la lecture de la base d'un autre service.

## Décision
- Un seul déployable `services/casier`, découpé en modules Spring Modulith : `audit`, `habilitations`, `regles`, `registre`, `identification`, `tarifs`, `demandes`, `bulletins`, `verification`, `commun`.
- Un schéma PostgreSQL par module. Les échanges passent par l'API Java publique du module ou par des événements de domaine.
- Les événements sont persistés (registre de publication Spring Modulith en base) : ils sont rejouables et traités une seule fois (REG-06).
- `verification` reçoit une copie minimale par événements, comme s'il était déjà un service séparé (ARC-01).

## Conséquences
- Un test d'architecture (`ApplicationModules.verify()`) bloque toute dépendance interdite ou cyclique.
- Le découpage en services (paiement, notifications, vérification publique) se fera module par module, sans réécriture du cœur.
