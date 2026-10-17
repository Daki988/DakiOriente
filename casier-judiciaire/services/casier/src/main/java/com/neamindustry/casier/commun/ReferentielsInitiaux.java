package com.neamindustry.casier.commun;

import java.nio.file.Path;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * ADM-22, ADR 0005 : référentiels chargés dans un environnement vide (démonstration, recette).
 * Les fichiers sont des données versionnées dans {@code casier-judiciaire/referentiels/}, jamais du code.
 *
 * @param importAuDemarrage charger les référentiels au démarrage si les tables sont vides
 * @param dossier           dossier des référentiels
 * @param tarifs            fichier du barème
 * @param regles            fichier du jeu de règles juridiques
 */
@ConfigurationProperties("casier.referentiels")
public record ReferentielsInitiaux(boolean importAuDemarrage, Path dossier, String tarifs, String regles) {

    public ReferentielsInitiaux {
        dossier = dossier == null ? Path.of("../../referentiels") : dossier;
    }

    public Path fichier(String nom) {
        return dossier.resolve(nom).normalize();
    }
}
