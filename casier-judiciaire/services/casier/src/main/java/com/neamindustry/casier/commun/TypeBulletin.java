package com.neamindustry.casier.commun;

/** Bulletin délivré par la plateforme : le n°3, remis à la personne concernée (section 6). */
public enum TypeBulletin {
    B3("Bulletin n°3");

    private final String libelle;

    TypeBulletin(String libelle) {
        this.libelle = libelle;
    }

    public String libelle() {
        return libelle;
    }
}
