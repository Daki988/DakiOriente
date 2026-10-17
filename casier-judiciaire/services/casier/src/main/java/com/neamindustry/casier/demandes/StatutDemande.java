package com.neamindustry.casier.demandes;

/** États d'une demande, affichés dans la frise de suivi (PUB-07). */
public enum StatutDemande {
    EN_ATTENTE_PAIEMENT("Demande enregistrée, en attente de paiement"),
    EN_TRAITEMENT("Paiement confirmé, demande en cours de traitement"),
    A_TRAITER_PAR_AGENT("Vérification en cours par un agent du casier"),
    EN_ATTENTE_PIECE("Pièce complémentaire demandée"),
    DELIVREE("Bulletin disponible dans votre espace"),
    REJETEE("Demande rejetée");

    private final String libelle;

    StatutDemande(String libelle) {
        this.libelle = libelle;
    }

    public String libelle() {
        return libelle;
    }
}
