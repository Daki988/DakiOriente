package com.neamindustry.casier.bulletins;

import java.time.LocalDate;

/** Identité complète portée sur le bulletin (BUL-02). */
public record IdentiteSurBulletin(String nom, String prenoms, LocalDate dateNaissance, String lieuNaissance, String nomPere,
                                  String nomMere) {
}
