package com.neamindustry.casier.pilotage.web;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.neamindustry.casier.bulletins.EmissionBulletins;
import com.neamindustry.casier.demandes.IndicateursDemandes;
import com.neamindustry.casier.demandes.ServiceDemandes;
import com.neamindustry.casier.habilitations.ActeurCourant;
import com.neamindustry.casier.verification.VerificationPublique;

/** DSH-07, DSH-08 : indicateurs agrégés, réservés à la direction centrale (R08) et aux décideurs (R09). */
@RestController
class PilotageControleur {

    record Indicateurs(IndicateursDemandes demandes, Map<String, Long> bulletins, long verifications) {
    }

    private final ServiceDemandes demandes;
    private final EmissionBulletins bulletins;
    private final VerificationPublique verification;
    private final ActeurCourant acteur;

    PilotageControleur(ServiceDemandes demandes, EmissionBulletins bulletins, VerificationPublique verification, ActeurCourant acteur) {
        this.demandes = demandes;
        this.bulletins = bulletins;
        this.verification = verification;
        this.acteur = acteur;
    }

    @GetMapping("/api/v1/pilotage/indicateurs")
    Indicateurs indicateurs() {
        IndicateursDemandes d = demandes.indicateurs(acteur.obtenir());
        return new Indicateurs(d, bulletins.statistiques(), verification.totalVerifications());
    }
}
