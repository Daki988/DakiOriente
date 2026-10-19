package com.neamindustry.casier.habilitations;

/** Actions soumises à habilitation (colonne « Peut » de la section 5). */
public enum Permission {
    DEMANDER_B3_POUR_SOI,
    SAISIR_DEMANDE_ASSISTEE,
    VERIFIER_IDENTITE_SUR_PIECES,
    SAISIR_INSCRIPTION,
    TRAITER_CAS_DOUTEUX,
    VALIDER_INSCRIPTION,
    REVOQUER_BULLETIN,
    SUPERVISER_NATIONAL,
    PROPOSER_PARAMETRE_JURIDIQUE,
    VALIDER_PARAMETRE_JURIDIQUE,
    LIRE_TABLEAUX_AGREGES,
    GERER_PAIEMENTS,
    TRAITER_RECLAMATIONS,
    LIRE_JOURNAL_AUDIT,
    PARAMETRER_PLATEFORME,
    PROPOSER_TARIF,
    VALIDER_TARIF,
    VERIFIER_BULLETIN,
    /** Validation et impression des bulletins au guichet (tableau de bord du validateur). */
    IMPRIMER_BULLETIN
}
