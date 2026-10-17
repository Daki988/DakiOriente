package com.neamindustry.casier.commun;

/**
 * Erreur fonctionnelle dont le message, en français, peut être montré à l'utilisateur (ERG-05).
 * Le code sert à la traçabilité ; il n'est jamais affiché seul.
 */
public class ErreurMetier extends RuntimeException {

    /** Nature de l'erreur, traduite en statut HTTP par la couche web. */
    public enum Nature { REGLE_METIER, INTROUVABLE, ACCES_REFUSE, CONFLIT }

    private final Nature nature;
    private final String code;

    public ErreurMetier(String code, String message) {
        this(Nature.REGLE_METIER, code, message);
    }

    public ErreurMetier(Nature nature, String code, String message) {
        super(message);
        this.nature = nature;
        this.code = code;
    }

    public Nature nature() {
        return nature;
    }

    public String code() {
        return code;
    }
}
