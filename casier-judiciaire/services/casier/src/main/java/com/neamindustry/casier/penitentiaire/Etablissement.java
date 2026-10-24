package com.neamindustry.casier.penitentiaire;

/** Établissement pénitentiaire du référentiel. */
public record Etablissement(String code, String nom, String ville, String province, String type, int capacite) {
}
