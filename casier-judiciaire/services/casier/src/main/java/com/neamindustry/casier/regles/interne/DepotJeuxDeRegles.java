package com.neamindustry.casier.regles.interne;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import com.neamindustry.casier.regles.CasDeTest;
import com.neamindustry.casier.regles.JeuDeRegles;
import com.neamindustry.casier.regles.ReglesBulletins;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

/** Stockage des jeux de règles (schéma {@code regles}). Aucune suppression : l'historique reste lisible (REG-08). */
@Repository
public class DepotJeuxDeRegles {

    private static final TypeReference<List<CasDeTest>> LISTE_CAS = new TypeReference<>() {
    };

    private final JdbcClient jdbc;
    private final JsonMapper json;

    DepotJeuxDeRegles(JdbcClient jdbc, JsonMapper json) {
        this.jdbc = jdbc;
        this.json = json;
    }

    public int prochaineVersion() {
        return jdbc.sql("select coalesce(max(version), 0) + 1 from regles.jeu_de_regles").query(Integer.class).single();
    }

    public void inserer(JeuDeRegles j) {
        jdbc.sql("""
                        insert into regles.jeu_de_regles(id, version, date_effet, statut, propose_par, propose_le, valide_par,
                                                        valide_le, fictif, contenu, cas_de_test)
                        values (:id, :version, :dateEffet, :statut, :proposePar, :proposeLe, :validePar, :valideLe, :fictif,
                                cast(:contenu as jsonb), cast(:cas as jsonb))""")
                .param("id", j.id())
                .param("version", j.version())
                .param("dateEffet", j.dateEffet())
                .param("statut", j.statut().name())
                .param("proposePar", j.proposePar())
                .param("proposeLe", Timestamp.from(j.proposeLe()))
                .param("validePar", j.validePar())
                .param("valideLe", j.valideLe() == null ? null : Timestamp.from(j.valideLe()))
                .param("fictif", j.fictif())
                .param("contenu", json.writeValueAsString(j.contenu()))
                .param("cas", json.writeValueAsString(j.casDeTest()))
                .update();
    }

    public void changerStatut(UUID id, JeuDeRegles.Statut statut, String validePar, Instant le, String motifRejet) {
        jdbc.sql("""
                        update regles.jeu_de_regles set statut = :statut, valide_par = :par, valide_le = :le, motif_rejet = :motif
                        where id = :id and statut = 'PROPOSE'""")
                .param("statut", statut.name())
                .param("par", validePar)
                .param("le", Timestamp.from(le))
                .param("motif", motifRejet)
                .param("id", id)
                .update();
    }

    public Optional<JeuDeRegles> parId(UUID id) {
        return jdbc.sql("select * from regles.jeu_de_regles where id = :id").param("id", id).query(this::lire).optional();
    }

    public Optional<JeuDeRegles> publieEnVigueurAu(LocalDate date) {
        return jdbc.sql("""
                        select * from regles.jeu_de_regles where statut = 'PUBLIE' and date_effet <= :date
                        order by date_effet desc, version desc limit 1""")
                .param("date", date)
                .query(this::lire).optional();
    }

    public long nombre() {
        return jdbc.sql("select count(*) from regles.jeu_de_regles").query(Long.class).single();
    }

    private JeuDeRegles lire(ResultSet rs, int i) throws SQLException {
        Timestamp valideLe = rs.getTimestamp("valide_le");
        return new JeuDeRegles(rs.getObject("id", UUID.class), rs.getInt("version"),
                rs.getObject("date_effet", LocalDate.class), JeuDeRegles.Statut.valueOf(rs.getString("statut")),
                rs.getString("propose_par"), rs.getTimestamp("propose_le").toInstant(), rs.getString("valide_par"),
                valideLe == null ? null : valideLe.toInstant(), rs.getString("motif_rejet"), rs.getBoolean("fictif"),
                json.readValue(rs.getString("contenu"), ReglesBulletins.class),
                json.readValue(rs.getString("cas_de_test"), LISTE_CAS));
    }
}
