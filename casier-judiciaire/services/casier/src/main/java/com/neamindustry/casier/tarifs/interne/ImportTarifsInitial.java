package com.neamindustry.casier.tarifs.interne;

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
import com.neamindustry.casier.tarifs.ReferentielTarifs;
import com.neamindustry.casier.tarifs.Tarif;

import tools.jackson.databind.json.JsonMapper;

/** ADM-22 : charge le barème de {@code referentiels/} dans un environnement vide ; sans effet si des tarifs existent. */
@Component
@Order(2)
@ConditionalOnProperty(name = "casier.referentiels.import-au-demarrage", havingValue = "true")
class ImportTarifsInitial implements ApplicationRunner {

    private static final Logger LOG = LoggerFactory.getLogger(ImportTarifsInitial.class);

    record Fichier(String source, LocalDate dateEffet, boolean provisoire, List<String> aDecider, List<Ligne> tarifs) {
    }

    record Ligne(String acte, String profil, long montantFcfa, String libelle) {
    }

    private final ReferentielTarifs referentiel;
    private final ReferentielsInitiaux referentiels;
    private final JsonMapper json;

    ImportTarifsInitial(ReferentielTarifs referentiel, ReferentielsInitiaux referentiels, JsonMapper json) {
        this.referentiel = referentiel;
        this.referentiels = referentiels;
        this.json = json;
    }

    @Override
    public void run(ApplicationArguments args) throws IOException {
        if (referentiels.tarifs() == null) {
            return;
        }
        Path chemin = referentiels.fichier(referentiels.tarifs());
        Fichier f = json.readValue(Files.readString(chemin), Fichier.class);
        List<Tarif> tarifs = f.tarifs().stream()
                .map(l -> new Tarif(null, l.acte(), l.profil(), l.montantFcfa(), f.dateEffet(), Tarif.Statut.VALIDE, f.provisoire(),
                        l.libelle(), f.source(), null, null))
                .toList();
        try {
            int n = referentiel.importerInitial(chemin.getFileName().toString(), tarifs);
            LOG.info("Référentiel des tarifs chargé : {} lignes depuis {}", n, chemin.getFileName());
        } catch (ErreurMetier e) {
            if (!"ADM-22".equals(e.code())) {
                throw e;
            }
            LOG.info("Référentiel des tarifs déjà présent : import ignoré.");
        }
    }
}
