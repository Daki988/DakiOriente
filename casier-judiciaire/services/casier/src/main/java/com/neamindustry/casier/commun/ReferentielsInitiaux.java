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
public record ReferentielsInitiaux(boolean importAuDemarrage, String dossier, String tarifs, String regles) {

    public ReferentielsInitiaux {
        // Chaîne et non Path : un chemin relatif ne doit pas être interprété comme une ressource du classpath.
        dossier = dossier == null || dossier.isBlank() ? "../../referentiels" : dossier;
    }

    public Path fichier(String nom) {
        return Path.of(dossier).resolve(nom).toAbsolutePath().normalize();
    }
}
