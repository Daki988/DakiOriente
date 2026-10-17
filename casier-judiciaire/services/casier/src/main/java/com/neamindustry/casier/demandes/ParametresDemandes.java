package com.neamindustry.casier.demandes;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @param delaiTraitement délai de délivrance (24 heures, ENF-10)
 * @param seuilAlerte     délai restant sous lequel le dossier est signalé (DSH-16)
 * @param adressePortail  adresse du portail citée dans les avis (NOT-01 : un lien, jamais le contenu du casier)
 */
@ConfigurationProperties("casier.demandes")
public record ParametresDemandes(Duration delaiTraitement, Duration seuilAlerte, String adressePortail) {

    public ParametresDemandes {
        adressePortail = adressePortail == null || adressePortail.isBlank()
                ? "https://casier-judiciaire.neamindustry.com" : adressePortail.replaceAll("/+$", "");
        delaiTraitement = delaiTraitement == null ? Duration.ofHours(24) : delaiTraitement;
        seuilAlerte = seuilAlerte == null ? Duration.ofHours(4) : seuilAlerte;
    }
}
