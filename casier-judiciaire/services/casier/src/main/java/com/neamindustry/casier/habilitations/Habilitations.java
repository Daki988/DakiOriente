package com.neamindustry.casier.habilitations;

import java.util.Objects;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;

/**
 * Point de contrôle unique des habilitations. Chaque service métier l'appelle avant d'agir ;
 * un refus lève {@link AccesRefuse} et l'action n'a pas lieu.
 */
@Service
public class Habilitations {

    private final JdbcClient jdbc;

    Habilitations(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    /** HAB-01 : contrôle par rôle, au moindre privilège. */
    public void exiger(Acteur acteur, Permission permission) {
        if (!MatriceHabilitations.autorise(acteur.roles(), permission)) {
            throw new AccesRefuse("HAB-01", "Votre profil ne permet pas cette action (" + permission + ").");
        }
    }

    /** HAB-02 : le valideur doit être une personne distincte de l'auteur. */
    public void exigerQuatreYeux(String auteur, Acteur valideur) {
        if (Objects.equals(auteur, valideur.identifiant())) {
            throw new AccesRefuse("HAB-02", "Une seconde personne doit valider : vous ne pouvez pas valider votre propre saisie.");
        }
    }

    /** HAB-01 : un acteur de juridiction n'agit que dans sa juridiction ; la direction centrale (R08) a un périmètre national. */
    public void exigerJuridiction(Acteur acteur, String juridiction) {
        if (acteur.aLeRole(Role.R08)) {
            return;
        }
        if (acteur.juridiction() == null || !acteur.juridiction().equals(juridiction)) {
            throw new AccesRefuse("HAB-01", "Cette opération relève de la juridiction " + juridiction + ", hors de votre périmètre.");
        }
    }

    /** HAB-05 : pas de traitement du casier d'un proche déclaré. */
    public void exigerSansConflitInterets(Acteur acteur, UUID personneId) {
        if (personneId == null) {
            return;
        }
        boolean conflit = jdbc.sql("""
                        select count(*) from habilitations.declaration_interet
                        where acteur_id = :acteur and personne_id = :personne""")
                .param("acteur", acteur.identifiant())
                .param("personne", personneId)
                .query(Long.class).single() > 0;
        if (conflit) {
            throw new AccesRefuse("HAB-05", "Conflit d'intérêts déclaré : ce dossier doit être traité par un autre agent.");
        }
    }

    /** HAB-05 : enregistre une déclaration d'intérêts (lien familial, sa propre fiche). */
    public void declarerInteret(String acteurId, UUID personneId) {
        jdbc.sql("""
                        insert into habilitations.declaration_interet(acteur_id, personne_id) values (:acteur, :personne)
                        on conflict do nothing""")
                .param("acteur", acteurId)
                .param("personne", personneId)
                .update();
    }

}
