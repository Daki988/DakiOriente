package com.neamindustry.casier.regles.interne;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import com.neamindustry.casier.commun.ErreurMetier;
import com.neamindustry.casier.commun.ReferentielsInitiaux;
import com.neamindustry.casier.regles.CasDeTest;
import com.neamindustry.casier.regles.ParametresJuridiques;
import com.neamindustry.casier.regles.ReglesBulletins;

import tools.jackson.databind.json.JsonMapper;

/**
 * ADM-22 : charge le jeu de règles initial de {@code referentiels/} dans un environnement vide. Ses cas de test sont exécutés
 * avant tout enregistrement (ADM-05) ; sans effet si un jeu existe déjà.
 */
@Component
@Order(1)
@ConditionalOnProperty(name = "casier.referentiels.import-au-demarrage", havingValue = "true")
class ImportReglesInitial implements ApplicationRunner {

    private static final Logger LOG = LoggerFactory.getLogger(ImportReglesInitial.class);

    record Fichier(String source, String avertissement, LocalDate dateEffet, boolean fictif, ReglesBulletins contenu,
                   List<CasDeTest> casDeTest) {
    }

    private final ParametresJuridiques parametres;
    private final ReferentielsInitiaux referentiels;
    private final JsonMapper json;

    ImportReglesInitial(ParametresJuridiques parametres, ReferentielsInitiaux referentiels, JsonMapper json) {
        this.parametres = parametres;
        this.referentiels = referentiels;
        this.json = json;
    }

    @Override
    public void run(ApplicationArguments args) throws IOException {
        if (referentiels.regles() == null) {
            return;
        }
        Path chemin = referentiels.fichier(referentiels.regles());
        Fichier f = json.readValue(Files.readString(chemin), Fichier.class);
        try {
            parametres.importerJeuInitial(chemin.getFileName().toString(), f.contenu(), f.dateEffet(), f.casDeTest(), f.fictif());
            LOG.info("Jeu de règles initial chargé depuis {} (fictif : {})", chemin.getFileName(), f.fictif());
        } catch (ErreurMetier e) {
            if (!"ADM-22".equals(e.code())) {
                throw e;
            }
            LOG.info("Paramètres juridiques déjà présents : import ignoré.");
        }
    }
}
