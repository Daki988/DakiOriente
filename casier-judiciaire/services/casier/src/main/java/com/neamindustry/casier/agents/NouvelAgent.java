package com.neamindustry.casier.agents;

/** Données saisies pour créer le compte d'un agent. */
public record NouvelAgent(String login, String prenom, String nom, String email, String role, String juridiction) {
}
