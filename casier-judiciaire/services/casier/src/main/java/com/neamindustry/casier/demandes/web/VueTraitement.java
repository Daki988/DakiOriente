package com.neamindustry.casier.demandes.web;

import com.neamindustry.casier.demandes.ResultatTraitement;
import com.neamindustry.casier.demandes.StatutDemande;

/**
 * Résultat d'un traitement renvoyé aux agents et aux opérateurs : jamais le jeton ni le code de vérification du bulletin,
 * remis uniquement à l'usager dans son espace (ADR 0004).
 */
record VueTraitement(String numeroDossier, StatutDemande statut, String numeroBulletin) {

    static VueTraitement de(ResultatTraitement r) {
        return new VueTraitement(r.numeroDossier(), r.statut(), r.bulletin() == null ? null : r.bulletin().numero());
    }
}
