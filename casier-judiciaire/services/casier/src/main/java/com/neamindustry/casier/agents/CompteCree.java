package com.neamindustry.casier.agents;

/**
 * Compte créé. Le mot de passe provisoire n'est affiché qu'une fois ; l'agent doit le changer et configurer son double
 * facteur à sa première connexion.
 */
public record CompteCree(CompteAgent compte, String motDePasseProvisoire) {
}
