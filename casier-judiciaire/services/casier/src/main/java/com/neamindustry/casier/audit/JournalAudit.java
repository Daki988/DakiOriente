package com.neamindustry.casier.audit;

import java.util.List;

/** API du journal d'audit. L'écriture rejoint la transaction de l'action tracée. */
public interface JournalAudit {

    EntreeJournal enregistrer(EvenementAudit evenement);

    ResultatIntegrite verifierIntegrite();

    List<EntreeJournal> dernieres(int nombre);

    List<EntreeJournal> parPersonneConcernee(String personneId);

    /** Entrées portant sur les objets donnés (identifiants) ou concernant les personnes données, par ordre chronologique. */
    List<EntreeJournal> parObjetsOuPersonnes(java.util.Collection<String> objets, java.util.Collection<String> personnes);
}
