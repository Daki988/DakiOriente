# ADR 0004 — Jetons et codes de vérification des bulletins

Statut : accepté (16/10/2026)

## Décision
- Jeton du QR code : 32 octets aléatoires (256 bits, `SecureRandom`), encodés en base64url (BUL-06). Jamais séquentiel, jamais dérivé d'une donnée personnelle.
- Code court imprimé en clair : 12 caractères Crockford base32 (60 bits), affichés `XXXX-XXXX-XXXX` (BUL-03).
- Seules les empreintes SHA-256 du jeton et du code sont stockées. Une fuite de la base ne permet pas de forger une adresse de vérification.
- La vérification publique (ARC-01) lit sa propre table, alimentée par événements ; elle ne voit ni les condamnations ni la fiche.
- Limitation de débit par adresse réseau sur les points d'accès publics (BUL-09) ; en production, complétée par le pare-feu applicatif (SEC-04).
