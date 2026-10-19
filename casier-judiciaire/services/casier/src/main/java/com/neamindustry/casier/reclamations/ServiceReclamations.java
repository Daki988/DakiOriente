package com.neamindustry.casier.reclamations;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.time.Year;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.neamindustry.casier.audit.EvenementAudit;
import com.neamindustry.casier.audit.JournalAudit;
import com.neamindustry.casier.commun.ErreurMetier;
import com.neamindustry.casier.commun.RessourceIntrouvable;
import com.neamindustry.casier.habilitations.Acteur;
import com.neamindustry.casier.habilitations.Habilitations;
import com.neamindustry.casier.habilitations.Permission;

/** Dépôt d'une réclamation par l'usager, prise en charge et réponse par le support (R11). */
@Service
public class ServiceReclamations {

    private static final ZoneId LIBREVILLE = ZoneId.of("Africa/Libreville");

    private final JdbcClient jdbc;
    private final Habilitations habilitations;
    private final JournalAudit journal;
    private final Clock horloge;

    ServiceReclamations(JdbcClient jdbc, Habilitations habilitations, JournalAudit journal, Clock horloge) {
        this.jdbc = jdbc;
        this.habilitations = habilitations;
        this.journal = journal;
        this.horloge = horloge;
    }

    /** L'usager connecté dépose une réclamation, rattachée ou non à l'un de ses dossiers. */
    @Transactional
    public Reclamation deposer(Acteur usager, CategorieReclamation categorie, String numeroDossier, String message) {
        habilitations.exiger(usager, Permission.DEMANDER_B3_POUR_SOI);
        String texte = message == null ? "" : message.strip();
        if (texte.length() < 10 || texte.length() > 2000) {
            throw new ErreurMetier("REC-01", "Décrivez votre réclamation en 10 à 2 000 caractères.");
        }
        String dossier = numeroDossier == null || numeroDossier.isBlank() ? null : numeroDossier.strip().toUpperCase();
        Instant maintenant = Instant.now(horloge);
        long rang = jdbc.sql("select nextval('reclamations.numero_seq')").query(Long.class).single();
        String numero = "RC-%d-%06d".formatted(Year.now(horloge.withZone(LIBREVILLE)).getValue(), rang);
        UUID id = UUID.randomUUID();
        jdbc.sql("""
                        insert into reclamations.reclamation(id, numero, demandeur_id, numero_dossier, categorie, message, statut, cree_le)
                        values (:id, :numero, :demandeur, :dossier, :categorie, :message, 'OUVERTE', :le)""")
                .param("id", id).param("numero", numero).param("demandeur", usager.identifiant()).param("dossier", dossier)
                .param("categorie", categorie.name()).param("message", texte).param("le", Timestamp.from(maintenant))
                .update();
        journal.enregistrer(EvenementAudit.par(usager, "RECLAMATION_DEPOSEE", "Reclamation", id.toString(), null, null,
                Map.of("numero", numero, "categorie", categorie.name())));
        return parId(id);
    }

    /** Réclamations de l'usager connecté, la plus récente d'abord. */
    @Transactional(readOnly = true)
    public List<Reclamation> mesReclamations(Acteur usager) {
        return jdbc.sql("select * from reclamations.reclamation where demandeur_id = :d order by cree_le desc")
                .param("d", usager.identifiant()).query(ServiceReclamations::lire).list();
    }

    /** File du support : réclamations non traitées d'abord, de la plus ancienne à la plus récente. */
    @Transactional(readOnly = true)
    public List<Reclamation> file(Acteur agent) {
        habilitations.exiger(agent, Permission.TRAITER_RECLAMATIONS);
        return jdbc.sql("""
                        select * from reclamations.reclamation
                        order by (statut = 'TRAITEE'), cree_le
                        limit 200""")
                .query(ServiceReclamations::lire).list();
    }

    @Transactional
    public void prendreEnCharge(Acteur agent, UUID id) {
        habilitations.exiger(agent, Permission.TRAITER_RECLAMATIONS);
        int n = jdbc.sql("""
                        update reclamations.reclamation set statut = 'EN_COURS', pris_en_charge_par = :agent, pris_en_charge_le = :le
                        where id = :id and statut = 'OUVERTE'""")
                .param("id", id).param("agent", agent.identifiant()).param("le", Timestamp.from(Instant.now(horloge))).update();
        if (n != 1) {
            existe(id);
            throw new ErreurMetier(ErreurMetier.Nature.CONFLIT, "REC-02", "Cette réclamation est déjà prise en charge.");
        }
        journal.enregistrer(EvenementAudit.par(agent, "RECLAMATION_PRISE_EN_CHARGE", "Reclamation", id.toString(), null, null, Map.of()));
    }

    /** Réponse écrite à l'usager ; elle clôt la réclamation. */
    @Transactional
    public void repondre(Acteur agent, UUID id, String reponse) {
        habilitations.exiger(agent, Permission.TRAITER_RECLAMATIONS);
        String texte = reponse == null ? "" : reponse.strip();
        if (texte.length() < 10) {
            throw new ErreurMetier("REC-03", "La réponse à l'usager doit être rédigée (10 caractères au moins).");
        }
        int n = jdbc.sql("""
                        update reclamations.reclamation set statut = 'TRAITEE', reponse = :reponse, traite_par = :agent, traite_le = :le,
                               pris_en_charge_par = coalesce(pris_en_charge_par, :agent), pris_en_charge_le = coalesce(pris_en_charge_le, :le)
                        where id = :id and statut <> 'TRAITEE'""")
                .param("id", id).param("reponse", texte).param("agent", agent.identifiant())
                .param("le", Timestamp.from(Instant.now(horloge))).update();
        if (n != 1) {
            existe(id);
            throw new ErreurMetier(ErreurMetier.Nature.CONFLIT, "REC-03", "Cette réclamation a déjà reçu une réponse.");
        }
        journal.enregistrer(EvenementAudit.par(agent, "RECLAMATION_TRAITEE", "Reclamation", id.toString(), null, null, Map.of()));
    }

    private Reclamation parId(UUID id) {
        return jdbc.sql("select * from reclamations.reclamation where id = :id").param("id", id)
                .query(ServiceReclamations::lire).optional().orElseThrow(() -> new RessourceIntrouvable("Réclamation introuvable."));
    }

    private void existe(UUID id) {
        parId(id);
    }

    private static Reclamation lire(ResultSet rs, int i) throws SQLException {
        return new Reclamation(rs.getObject("id", UUID.class), rs.getString("numero"), rs.getString("numero_dossier"),
                CategorieReclamation.valueOf(rs.getString("categorie")), rs.getString("message"),
                StatutReclamation.valueOf(rs.getString("statut")), instant(rs, "cree_le"), instant(rs, "pris_en_charge_le"),
                rs.getString("reponse"), instant(rs, "traite_le"));
    }

    private static Instant instant(ResultSet rs, String colonne) throws SQLException {
        Timestamp t = rs.getTimestamp(colonne);
        return t == null ? null : t.toInstant();
    }
}
