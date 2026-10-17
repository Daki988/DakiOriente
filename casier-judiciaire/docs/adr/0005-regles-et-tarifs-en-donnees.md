# ADR 0005 — Règles juridiques et tarifs : des données versionnées

Statut : accepté (16/10/2026)

## Contexte
Section 3 : plusieurs textes d'application ne sont pas adoptés ; le barème est provisoire. Aucune règle de droit ni aucun tarif ne doit être codé en dur.

## Décision
- Module `regles` : jeux de règles versionnés (catégories retenues par bulletin, durées, délais d'effacement, validité). Cycle : proposé (direction centrale, R08) → validé (magistrat, R05, distinct du proposant) → publié avec une date d'effet future. Validation refusée si les cas de test joints ne passent pas (ADM-05).
- Module `tarifs` : tarifs par acte et profil, date d'effet, quatre yeux, aucune modification rétroactive (ADM-04). Le tarif appliqué est celui en vigueur à la date du paiement (RG-10).
- Les jeux livrés avec la démonstration (`src/main/resources/referentiels/`) sont marqués « fictif — à valider » ou « provisoire ». Ils se chargent par la fonction d'import (ADM-22), jamais par le code.
