package com.neamindustry.casier.regles;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.neamindustry.casier.audit.EvenementAudit;
import com.neamindustry.casier.audit.JournalAudit;
import com.neamindustry.casier.commun.ErreurMetier;
import com.neamindustry.casier.commun.RessourceIntrouvable;
import com.neamindustry.casier.habilitations.Acteur;
import com.neamindustry.casier.habilitations.Habilitations;
import com.neamindustry.casier.habilitations.Permission;
import com.neamindustry.casier.regles.interne.DepotJeuxDeRegles;

/**
 * Cycle de vie des paramètres juridiques (ADM-05) : proposition par la direction centrale (R08),
 * validation par un magistrat distinct (R05) après succès de tous les cas de test, date d'effet non rétroactive.
 */
@Service
public class ParametresJuridiques {

    private final DepotJeuxDeRegles depot;
    private final Habilitations habilitations;
    private final JournalAudit journal;
    private final Clock horloge;

    ParametresJuridiques(DepotJeuxDeRegles depot, Habilitations habilitations, JournalAudit journal, Clock horloge) {
        this.depot = depot;
        this.habilitations = habilitations;
        this.journal = journal;
        this.horloge = horloge;
    }

    @Transactional
    public JeuDeRegles proposer(Acteur acteur, ReglesBulletins contenu, LocalDate dateEffet, List<CasDeTest> cas) {
        habilitations.exiger(acteur, Permission.PROPOSER_PARAMETRE_JURIDIQUE);
        if (dateEffet.isBefore(LocalDate.now(horloge))) {
            throw new ErreurMetier("ADM-05", "La date d'effet ne peut pas être antérieure à aujourd'hui.");
        }
        if (cas == null || cas.isEmpty()) {
            throw new ErreurMetier("ADM-05", "Un jeu de tests est obligatoire avant publication.");
        }
        JeuDeRegles jeu = new JeuDeRegles(UUID.randomUUID(), depot.prochaineVersion(), dateEffet, JeuDeRegles.Statut.PROPOSE,
                acteur.identifiant(), Instant.now(horloge), null, null, null, false, contenu, cas);
        depot.inserer(jeu);
        journal.enregistrer(EvenementAudit.par(acteur, "PARAMETRES_JURIDIQUES_PROPOSES", "JeuDeRegles", jeu.id().toString(),
                null, contenu.reference(), Map.of("version", String.valueOf(jeu.version()), "dateEffet", dateEffet.toString())));
        return jeu;
    }

    @Transactional
    public JeuDeRegles valider(Acteur magistrat, UUID id) {
        habilitations.exiger(magistrat, Permission.VALIDER_PARAMETRE_JURIDIQUE);
        JeuDeRegles jeu = proposeOuErreur(id);
        habilitations.exigerQuatreYeux(jeu.proposePar(), magistrat);
        List<String> echecs = executerCasDeTest(jeu);
        if (!echecs.isEmpty()) {
            throw new ErreurMetier("ADM-05", "Cas de test en échec, publication impossible : " + String.join(" ; ", echecs));
        }
        if (jeu.dateEffet().isBefore(LocalDate.now(horloge))) {
            throw new ErreurMetier("ADM-05", "La date d'effet est dépassée : proposez une nouvelle version.");
        }
        depot.changerStatut(id, JeuDeRegles.Statut.PUBLIE, magistrat.identifiant(), Instant.now(horloge), null);
        journal.enregistrer(EvenementAudit.par(magistrat, "PARAMETRES_JURIDIQUES_PUBLIES", "JeuDeRegles", id.toString(),
                null, jeu.contenu().reference(), Map.of("version", String.valueOf(jeu.version()))));
        return depot.parId(id).orElseThrow();
    }

    @Transactional
    public void rejeter(Acteur magistrat, UUID id, String motif) {
        habilitations.exiger(magistrat, Permission.VALIDER_PARAMETRE_JURIDIQUE);
        proposeOuErreur(id);
        if (motif == null || motif.isBlank()) {
            throw new ErreurMetier("ADM-05", "Le motif du rejet est obligatoire.");
        }
        depot.changerStatut(id, JeuDeRegles.Statut.REJETE, magistrat.identifiant(), Instant.now(horloge), motif);
        journal.enregistrer(EvenementAudit.par(magistrat, "PARAMETRES_JURIDIQUES_REJETES", "JeuDeRegles", id.toString(),
                null, motif, Map.of()));
    }

    /**
     * Chargement du jeu initial d'un environnement vide (ADM-22). Refusé dès qu'un jeu existe :
     * toute évolution passe ensuite par proposition et validation.
     */
    @Transactional
    public JeuDeRegles importerJeuInitial(String source, ReglesBulletins contenu, LocalDate dateEffet, List<CasDeTest> cas,
                                          boolean fictif) {
        if (depot.nombre() > 0) {
            throw new ErreurMetier("ADM-22", "Des paramètres juridiques existent déjà : utilisez le circuit de validation.");
        }
        JeuDeRegles jeu = new JeuDeRegles(UUID.randomUUID(), 1, dateEffet, JeuDeRegles.Statut.PUBLIE, "import:" + source,
                Instant.now(horloge), "import:" + source, Instant.now(horloge), null, fictif, contenu, cas);
        List<String> echecs = executerCasDeTest(jeu);
        if (!echecs.isEmpty()) {
            throw new ErreurMetier("ADM-05", "Cas de test en échec dans le référentiel importé : " + String.join(" ; ", echecs));
        }
        depot.inserer(jeu);
        journal.enregistrer(new EvenementAudit("import:" + source, "", "PARAMETRES_JURIDIQUES_IMPORTES", "JeuDeRegles",
                jeu.id().toString(), null, contenu.reference(), Map.of("fictif", String.valueOf(fictif))));
        return jeu;
    }

    /** ADM-05 : versions des paramètres juridiques (proposées, publiées, rejetées). */
    @Transactional(readOnly = true)
    public List<JeuDeRegles> versions(Acteur acteur) {
        if (!com.neamindustry.casier.habilitations.MatriceHabilitations.autorise(acteur.roles(), Permission.PROPOSER_PARAMETRE_JURIDIQUE)
                && !com.neamindustry.casier.habilitations.MatriceHabilitations.autorise(acteur.roles(), Permission.VALIDER_PARAMETRE_JURIDIQUE)) {
            throw new com.neamindustry.casier.habilitations.AccesRefuse("HAB-01", "Votre profil ne permet pas de consulter les paramètres juridiques.");
        }
        return depot.tous();
    }

    public JeuDeRegles jeu(UUID id) {
        return depot.parId(id).orElseThrow(() -> new RessourceIntrouvable("Jeu de règles introuvable."));
    }

    static List<String> executerCasDeTest(JeuDeRegles jeu) {
        return jeu.casDeTest().stream()
                .filter(cas -> {
                    ResultatCalcul r = CalculateurBulletin.calculer(jeu.contenu(), jeu.version(), cas.type(),
                            cas.condamnations(), cas.dateCalcul());
                    return !new HashSet<>(r.retenues()).equals(new HashSet<>(cas.retenuesAttendues()));
                })
                .map(CasDeTest::libelle)
                .toList();
    }

    private JeuDeRegles proposeOuErreur(UUID id) {
        JeuDeRegles jeu = jeu(id);
        if (jeu.statut() != JeuDeRegles.Statut.PROPOSE) {
            throw new ErreurMetier(ErreurMetier.Nature.CONFLIT, "ADM-05", "Ce jeu de règles n'est plus en attente de validation.");
        }
        return jeu;
    }
}
