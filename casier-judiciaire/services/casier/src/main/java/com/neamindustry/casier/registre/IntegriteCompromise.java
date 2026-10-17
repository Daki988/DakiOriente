package com.neamindustry.casier.registre;

import com.neamindustry.casier.commun.ErreurMetier;

/** REG-09 : l'empreinte d'un enregistrement ne correspond plus à son contenu. Alerte de sécurité (SEC-13). */
public class IntegriteCompromise extends ErreurMetier {

    public IntegriteCompromise(String objet) {
        super(Nature.CONFLIT, "REG-09", "Contrôle d'intégrité en échec sur " + objet + " : lecture bloquée, alerte transmise.");
    }
}
