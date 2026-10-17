package com.neamindustry.casier.demandes;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * PAY-02, PAY-07.
 *
 * @param secretNotifications clé partagée avec l'agrégateur pour signer les notifications (variable d'environnement, SEC-05) ;
 *                            absente : toute notification est refusée
 * @param simulateur          simulateur de paiement de démonstration (ENV-03) ; jamais en production
 */
@ConfigurationProperties("casier.paiement")
public record ParametresPaiement(String secretNotifications, boolean simulateur) {
}
