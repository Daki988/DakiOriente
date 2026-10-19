package com.neamindustry.casier.agents;

import java.util.List;
import java.util.Optional;
import java.util.Set;

/** Accès aux comptes du fournisseur d'identité. */
public interface AnnuaireAgents {

    /** Comptes portant l'un des rôles donnés. */
    List<CompteAgent> comptes(Set<String> roles);

    Optional<CompteAgent> compte(String identifiant);

    /** Crée le compte avec un mot de passe provisoire, à changer à la première connexion avec configuration du double facteur. */
    CompteAgent creer(NouvelAgent agent, String motDePasseProvisoire);

    /** Remplace le rôle d'agent du compte (les autres rôles éventuels sont conservés). */
    void changerRole(String identifiant, String ancienRole, String nouveauRole);

    void changerJuridiction(String identifiant, String juridiction);

    void activer(String identifiant, boolean actif);
}
