package com.neamindustry.casier.commun;

/** Les trois bulletins tirés du même registre (section 6). */
public enum TypeBulletin {
    B1("Bulletin n°1"),
    B2("Bulletin n°2"),
    B3("Bulletin n°3");

    private final String libelle;

    TypeBulletin(String libelle) {
        this.libelle = libelle;
    }

    public String libelle() {
        return libelle;
    }
}
