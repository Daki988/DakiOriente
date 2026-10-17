package com.neamindustry.casier.demandes.interne;

import java.time.Clock;
import java.time.Instant;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.neamindustry.casier.demandes.ParametresDemandes;

/**
 * NOT-01 à NOT-04 : avis à l'usager par SMS et e-mail. Les messages contiennent un lien vers l'espace sécurisé, jamais le
 * bulletin ni une information sur le casier, et rappellent que le service ne demande jamais de code par téléphone.
 * L'envoi est simulé (ENV-03) tant que les expéditeurs officiels ne sont pas raccordés : l'avis est journalisé et visible
 * dans l'espace de l'usager.
 */
@Component
public class Avis {

    private static final Logger LOG = LoggerFactory.getLogger("casier.avis");
    static final String RAPPEL = " Le casier judiciaire ne vous demandera jamais de code par téléphone.";

    private final DepotDemandes depot;
    private final ParametresDemandes parametres;
    private final Clock horloge;

    Avis(DepotDemandes depot, ParametresDemandes parametres, Clock horloge) {
        this.depot = depot;
        this.parametres = parametres;
        this.horloge = horloge;
    }

    public void depose(UUID demandeId, String numero, String code) {
        envoyer(demandeId, "Casier judiciaire : demande " + numero + " enregistrée. Code de suivi : " + code
                + ". Suivi : " + parametres.adressePortail() + "/suivi." + RAPPEL);
    }

    public void delivre(UUID demandeId, String numero) {
        envoyer(demandeId, "Casier judiciaire : votre bulletin (dossier " + numero + ") est disponible dans votre espace : "
                + parametres.adressePortail() + "/espace." + RAPPEL);
    }

    public void pieceDemandee(UUID demandeId, String numero) {
        envoyer(demandeId, "Casier judiciaire : une pièce est demandée pour le dossier " + numero + ". Déposez-la depuis votre espace : "
                + parametres.adressePortail() + "/espace." + RAPPEL);
    }

    public void rejete(UUID demandeId, String numero) {
        envoyer(demandeId, "Casier judiciaire : le dossier " + numero + " n'a pas abouti. Motif et voies de réclamation dans votre espace : "
                + parametres.adressePortail() + "/espace." + RAPPEL);
    }

    private void envoyer(UUID demandeId, String message) {
        DepotDemandes.Contact c = depot.contact(demandeId);
        Instant maintenant = Instant.now(horloge);
        if (c.telephone() != null && !c.telephone().isBlank()) {
            depot.ajouterNotification(demandeId, "SMS", masquer(c.telephone()), message, "SIMULE", maintenant);
            LOG.info("SMS simulé vers {} : {}", masquer(c.telephone()), message);
        }
        if (c.email() != null && !c.email().isBlank()) {
            depot.ajouterNotification(demandeId, "EMAIL", masquer(c.email()), message, "SIMULE", maintenant);
        }
    }

    /** DON-02 : destination partiellement masquée dans les journaux et l'historique. */
    static String masquer(String destination) {
        if (destination.contains("@")) {
            int a = destination.indexOf('@');
            return destination.charAt(0) + "***" + destination.substring(a);
        }
        String chiffres = destination.replaceAll("\\s", "");
        return chiffres.length() <= 4 ? "****" : "****" + chiffres.substring(chiffres.length() - 4);
    }
}
