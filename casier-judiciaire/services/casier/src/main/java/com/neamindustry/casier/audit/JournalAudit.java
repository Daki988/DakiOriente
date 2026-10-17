package com.neamindustry.casier.audit;

import java.util.List;

/** API du journal d'audit. L'écriture rejoint la transaction de l'action tracée. */
public interface JournalAudit {

    EntreeJournal enregistrer(EvenementAudit evenement);

    ResultatIntegrite verifierIntegrite();

    List<EntreeJournal> dernieres(int nombre);

    List<EntreeJournal> parPersonneConcernee(String personneId);
}
