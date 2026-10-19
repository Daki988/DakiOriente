package com.neamindustry.casier.agents.interne;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.neamindustry.casier.agents.AnnuaireAgents;
import com.neamindustry.casier.agents.ParametresAgents;

/** Annuaire Keycloak si le client technique est configuré ; sinon un annuaire qui signale l'absence de configuration. */
@Configuration
class ConfigurationAnnuaire {

    @Bean
    AnnuaireAgents annuaireAgents(ParametresAgents parametres) {
        return parametres.configure() ? new AnnuaireKeycloak(parametres) : new AnnuaireNonConfigure();
    }
}
