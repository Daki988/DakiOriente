package com.neamindustry.casier.bulletins;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Ligne du tableau de bord du validateur : bulletin n°3 émis et état de son impression au guichet.
 *
 * @param etat {@code A_VALIDER}, {@code A_IMPRIMER}, {@code IMPRIME} ou {@code REVOQUE}
 */
public record BulletinAImprimer(UUID id, String numero, String nom, String prenoms, LocalDate dateNaissance, Instant dateEmission,
                                String etat, String validePar, Instant valideLe, Instant imprimeLe, String feuillet, int impressions) {
}
