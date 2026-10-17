package com.neamindustry.casier.commun;

/** La ressource demandée n'existe pas ou n'est pas visible pour l'acteur. */
public class RessourceIntrouvable extends ErreurMetier {

    public RessourceIntrouvable(String message) {
        super(Nature.INTROUVABLE, "INTROUVABLE", message);
    }
}
