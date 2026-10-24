package com.neamindustry.casier.agents;

import java.time.Instant;

/**
 * Compte d'un agent tel que l'affiche l'espace d'administration.
 *
 * @param identifiant identifiant du compte dans le fournisseur d'identité
 * @param login       nom de connexion
 * @param role        rôle de l'agent (code R02 à R18)
 * @param actif       faux si le compte est désactivé
 */
public record CompteAgent(String identifiant, String login, String prenom, String nom, String email, String role,
                          String juridiction, boolean actif, Instant creeLe) {
}
