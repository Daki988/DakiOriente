package com.neamindustry.casier.habilitations;

/** Les quatorze rôles de la plateforme (section 5). */
public enum Role {
    R01("Usager"),
    R02("Agent consulaire"),
    R03("Agent d'administration habilitée"),
    R04("Référent d'administration"),
    R05("Magistrat, Parquet"),
    R06("Agent du casier (greffe)"),
    R07("Greffier en chef"),
    R08("Direction centrale (affaires pénales)"),
    R09("Décideur"),
    R10("Comptable, régisseur"),
    R11("Support usagers"),
    R12("Auditeur"),
    R13("Super administrateur"),
    R14("Vérificateur public");

    private final String libelle;

    Role(String libelle) {
        this.libelle = libelle;
    }

    public String libelle() {
        return libelle;
    }
}
