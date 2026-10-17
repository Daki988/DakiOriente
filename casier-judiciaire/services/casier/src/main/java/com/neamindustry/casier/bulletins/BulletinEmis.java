package com.neamindustry.casier.bulletins;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import com.neamindustry.casier.commun.TypeBulletin;

/**
 * Événement publié à l'émission : il ne transporte que ce que la vérification publique peut montrer (BUL-07, ARC-01).
 */
public record BulletinEmis(UUID bulletinId, String numero, TypeBulletin type, String empreinteJeton, String empreinteCode,
                           Instant dateEmission, Instant dateExpiration, String nom, String prenoms,
                           LocalDate dateNaissance) {
}
