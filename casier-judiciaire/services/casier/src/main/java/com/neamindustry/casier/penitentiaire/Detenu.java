package com.neamindustry.casier.penitentiaire;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import com.neamindustry.casier.penitentiaire.Enumerations.StatutDetenu;
import com.neamindustry.casier.penitentiaire.Enumerations.TitreDetention;

/**
 * Fiche d'écrou et situation pénale.
 *
 * @param dateLiberationPrevue début de peine + durée − réductions accordées ; indicative, vérifiée par le greffe
 */
public record Detenu(UUID id, String numeroEcrou, String nom, String prenoms, LocalDate dateNaissance, String lieuNaissance,
                     String nationalite, String etablissement, String quartier, StatutDetenu statut, TitreDetention titreDetention,
                     String referenceTitre, String juridiction, String infraction, LocalDate dateEcrou, LocalDate dateDebutPeine,
                     Integer dureePeineMois, int reductionJours, LocalDate dateLiberationPrevue, LocalDate dateLiberation,
                     String motifLiberation, Instant ecroueLe) {
}
