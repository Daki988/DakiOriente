package com.neamindustry.casier.penitentiaire;

import java.time.Instant;
import java.time.LocalDate;

import com.neamindustry.casier.penitentiaire.Enumerations.MotifLiberation;
import com.neamindustry.casier.penitentiaire.Enumerations.TitreDetention;
import com.neamindustry.casier.penitentiaire.Enumerations.TypeMouvement;

/** Données saisies par les agents. */
public final class Saisies {

    private Saisies() {
    }

    /** Mise sous écrou sur la base d'un titre de détention (mandat de dépôt, jugement…). */
    public record NouvelEcrou(String nom, String prenoms, LocalDate dateNaissance, String lieuNaissance, String nationalite,
                              String quartier, TitreDetention titreDetention, String referenceTitre, String juridiction,
                              String infraction, LocalDate dateEcrou, LocalDate dateDebutPeine, Integer dureePeineMois) {
    }

    /** Condamnation d'un prévenu : la détention provisoire s'impute sur la peine (début de peine = date d'écrou par défaut). */
    public record Condamnation(TitreDetention titre, String reference, String juridiction, LocalDate dateDebutPeine, int dureePeineMois) {
    }

    public record NouveauMouvement(TypeMouvement type, String destination, String motif, Instant prevuLe, Instant retourPrevu) {
    }

    public record Liberation(MotifLiberation motif, LocalDate date, String precision) {
    }
}
