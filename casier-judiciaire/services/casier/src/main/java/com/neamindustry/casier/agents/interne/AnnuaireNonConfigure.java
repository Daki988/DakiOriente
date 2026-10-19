package com.neamindustry.casier.agents.interne;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import com.neamindustry.casier.agents.AnnuaireAgents;
import com.neamindustry.casier.agents.AnnuaireIndisponible;
import com.neamindustry.casier.agents.CompteAgent;
import com.neamindustry.casier.agents.NouvelAgent;

/** Utilisé tant que l'accès d'administration au fournisseur d'identité n'est pas configuré. */
class AnnuaireNonConfigure implements AnnuaireAgents {

    private static AnnuaireIndisponible indisponible() {
        return new AnnuaireIndisponible("La gestion des agents n'est pas encore configurée sur ce serveur.");
    }

    @Override
    public List<CompteAgent> comptes(Set<String> roles) {
        throw indisponible();
    }

    @Override
    public Optional<CompteAgent> compte(String identifiant) {
        throw indisponible();
    }

    @Override
    public CompteAgent creer(NouvelAgent agent, String motDePasseProvisoire) {
        throw indisponible();
    }

    @Override
    public void changerRole(String identifiant, String ancienRole, String nouveauRole) {
        throw indisponible();
    }

    @Override
    public void changerJuridiction(String identifiant, String juridiction) {
        throw indisponible();
    }

    @Override
    public void activer(String identifiant, boolean actif) {
        throw indisponible();
    }
}
