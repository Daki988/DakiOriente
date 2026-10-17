package com.neamindustry.casier.demandes;

import java.time.Instant;

/**
 * « Qui a consulté mes données » (inspiré du suivi des accès estonien) : chaque action sur les demandes, bulletins et
 * fiche de l'usager, avec la qualité de l'auteur (jamais son nom) et la finalité déclarée.
 */
public record AccesDonnees(Instant horodatage, String action, String auteur, String finalite) {
}
