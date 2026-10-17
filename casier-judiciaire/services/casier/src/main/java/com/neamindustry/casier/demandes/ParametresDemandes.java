package com.neamindustry.casier.demandes;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @param delaiTraitement délai de délivrance (24 heures, ENF-10)
 * @param seuilAlerte     délai restant sous lequel le dossier est signalé (DSH-16)
 */
@ConfigurationProperties("casier.demandes")
public record ParametresDemandes(Duration delaiTraitement, Duration seuilAlerte) {

    public ParametresDemandes {
        delaiTraitement = delaiTraitement == null ? Duration.ofHours(24) : delaiTraitement;
        seuilAlerte = seuilAlerte == null ? Duration.ofHours(4) : seuilAlerte;
    }
}
