package com.neamindustry.casier.bulletins;

import java.time.Instant;
import java.util.UUID;

/**
 * Bulletin émis. Le jeton et le code court n'existent en clair qu'ici, le temps de produire le QR code et le document :
 * seules leurs empreintes sont conservées (ADR 0004).
 */
public record BulletinDelivre(UUID id, String numero, String jeton, String codeCourt, Instant dateEmission,
                              Instant dateExpiration, ContenuBulletin contenu) {
}
