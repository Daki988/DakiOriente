package com.neamindustry.casier.demandes;

import com.neamindustry.casier.bulletins.BulletinDelivre;

/**
 * Issue d'un traitement de demande.
 *
 * @param bulletin bulletin émis, sinon {@code null} (dossier transmis à un agent)
 */
public record ResultatTraitement(String numeroDossier, StatutDemande statut, BulletinDelivre bulletin) {
}
