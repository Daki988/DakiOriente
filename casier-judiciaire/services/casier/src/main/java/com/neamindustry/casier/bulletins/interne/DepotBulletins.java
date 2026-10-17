package com.neamindustry.casier.bulletins.interne;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import com.neamindustry.casier.bulletins.ContenuBulletin;
import com.neamindustry.casier.commun.Empreintes;

import tools.jackson.databind.json.JsonMapper;

/** Registre des bulletins émis (schéma {@code bulletins}). Aucune suppression ; la révocation est un changement d'état. */
@Repository
public class DepotBulletins {

    private final JdbcClient jdbc;
    private final JsonMapper json;

    DepotBulletins(JdbcClient jdbc, JsonMapper json) {
        this.jdbc = jdbc;
        this.json = json;
    }

    /** Bulletin tel que conservé, sans jeton ni code en clair. */
    public record BulletinConserve(UUID id, String numero, String type, String statut, UUID personneId, String empreinteJeton,
                                   Instant dateEmission, Instant dateExpiration) {
    }

    public long prochainNumero() {
        return jdbc.sql("select nextval('bulletins.numero_seq')").query(Long.class).single();
    }

    public void inserer(UUID id, String numero, UUID demandeId, UUID personneId, ContenuBulletin contenu, String empreinteJeton,
                        String empreinteCode, Instant emission, Instant expiration, String emisPar, String finalite) {
        String contenuJson = json.writeValueAsString(contenu);
        jdbc.sql("""
                        insert into bulletins.bulletin(id, numero, type, demande_id, personne_id, nom, prenoms, date_naissance,
                            etat_casier_au, contenu, neant, version_regles, empreinte_contenu, empreinte_jeton, empreinte_code,
                            date_emission, date_expiration, statut, emis_par, finalite)
                        values (:id, :numero, :type, :demande, :personne, :nom, :prenoms, :naissance, :etat, cast(:contenu as jsonb),
                            :neant, :version, :empreinteContenu, :empreinteJeton, :empreinteCode, :emission, :expiration, 'EMIS',
                            :par, :finalite)""")
                .param("id", id).param("numero", numero).param("type", contenu.type().name()).param("demande", demandeId)
                .param("personne", personneId).param("nom", contenu.identite().nom()).param("prenoms", contenu.identite().prenoms())
                .param("naissance", contenu.identite().dateNaissance()).param("etat", Timestamp.from(contenu.etatDuCasierAu()))
                .param("contenu", contenuJson).param("neant", contenu.neant()).param("version", contenu.versionRegles())
                .param("empreinteContenu", Empreintes.sha256(contenuJson)).param("empreinteJeton", empreinteJeton)
                .param("empreinteCode", empreinteCode).param("emission", Timestamp.from(emission))
                .param("expiration", Timestamp.from(expiration)).param("par", emisPar).param("finalite", finalite)
                .update();
    }

    public Optional<BulletinConserve> parId(UUID id) {
        return jdbc.sql("select * from bulletins.bulletin where id = :id").param("id", id)
                .query((rs, n) -> new BulletinConserve(rs.getObject("id", UUID.class), rs.getString("numero"), rs.getString("type"),
                        rs.getString("statut"), rs.getObject("personne_id", UUID.class), rs.getString("empreinte_jeton"),
                        rs.getTimestamp("date_emission").toInstant(), rs.getTimestamp("date_expiration").toInstant()))
                .optional();
    }

    public Optional<ContenuBulletin> contenu(UUID id) {
        return jdbc.sql("select contenu from bulletins.bulletin where id = :id").param("id", id).query(String.class).optional()
                .map(c -> json.readValue(c, ContenuBulletin.class));
    }

    public int revoquer(UUID id, String par, Instant le, String motif) {
        return jdbc.sql("""
                        update bulletins.bulletin set statut = 'REVOQUE', revoque_par = :par, revoque_le = :le, motif_revocation = :motif
                        where id = :id and statut = 'EMIS'""")
                .param("par", par).param("le", Timestamp.from(le)).param("motif", motif).param("id", id).update();
    }
}
