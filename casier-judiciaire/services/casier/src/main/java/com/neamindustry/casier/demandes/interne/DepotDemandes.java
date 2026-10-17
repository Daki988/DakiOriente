package com.neamindustry.casier.demandes.interne;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import com.neamindustry.casier.demandes.IdentiteDeclaree;
import com.neamindustry.casier.demandes.ProfilDemandeur;
import com.neamindustry.casier.demandes.StatutDemande;
import com.neamindustry.casier.demandes.SuiviDemande;

import tools.jackson.databind.json.JsonMapper;

/** Accès au schéma {@code demandes}. */
@Repository
public class DepotDemandes {

    private final JdbcClient jdbc;
    private final JsonMapper json;

    DepotDemandes(JdbcClient jdbc, JsonMapper json) {
        this.jdbc = jdbc;
        this.json = json;
    }

    public long prochainNumero() {
        return jdbc.sql("select nextval('demandes.numero_seq')").query(Long.class).single();
    }

    public void inserer(Demande d) {
        jdbc.sql("""
                        insert into demandes.demande(id, numero_dossier, empreinte_code_suivi, type, profil, identite, demandeur_id,
                            identite_verifiee, statut, montant_fcfa, tarif_provisoire, cree_le)
                        values (:id, :numero, :code, 'B3', :profil, cast(:identite as jsonb), :demandeur, :verifiee, :statut,
                            :montant, :provisoire, :creeLe)""")
                .param("id", d.id()).param("numero", d.numeroDossier()).param("code", d.empreinteCodeSuivi())
                .param("profil", d.profil().name()).param("identite", json.writeValueAsString(d.identite()))
                .param("demandeur", d.demandeurId()).param("verifiee", d.identiteVerifiee()).param("statut", d.statut().name())
                .param("montant", d.montantFcfa()).param("provisoire", d.tarifProvisoire())
                .param("creeLe", Timestamp.from(d.creeLe()))
                .update();
    }

    public Optional<Demande> parId(UUID id) {
        return jdbc.sql("select * from demandes.demande where id = :id").param("id", id).query(this::lire).optional();
    }

    public Optional<Demande> parNumero(String numero) {
        return jdbc.sql("select * from demandes.demande where numero_dossier = :n").param("n", numero).query(this::lire).optional();
    }

    public Optional<Demande> parReferencePaiement(String reference) {
        return jdbc.sql("select * from demandes.demande where reference_paiement = :r").param("r", reference)
                .query(this::lire).optional();
    }

    /** Verrou pessimiste : deux traitements concurrents d'une même demande sont sérialisés. */
    public Optional<Demande> verrouiller(UUID id) {
        return jdbc.sql("select * from demandes.demande where id = :id for update").param("id", id).query(this::lire).optional();
    }

    public void enregistrerPaiement(UUID id, String reference, long montant, Instant payeLe, Instant echeance) {
        jdbc.sql("""
                        update demandes.demande set reference_paiement = :ref, montant_fcfa = :montant, paye_le = :payeLe,
                            echeance = :echeance, statut = 'EN_TRAITEMENT' where id = :id and statut = 'EN_ATTENTE_PAIEMENT'""")
                .param("ref", reference).param("montant", montant).param("payeLe", Timestamp.from(payeLe))
                .param("echeance", Timestamp.from(echeance)).param("id", id).update();
    }

    public void enregistrerRapprochement(UUID id, String issue, String explication, UUID personne) {
        jdbc.sql("""
                        update demandes.demande set issue_rapprochement = :issue, explication_rapprochement = :explication,
                            personne_rapprochee = :personne where id = :id""")
                .param("issue", issue).param("explication", explication).param("personne", personne).param("id", id).update();
    }

    /** Colonnes modifiables avec le statut : liste fermée, jamais issue d'une saisie. */
    private static final Set<String> COLONNES = Set.of("echeance", "suspendu_depuis", "motif_agent", "bulletin_id",
            "bulletin_numero", "motif_rejet", "personne_rapprochee");

    public void changerStatut(UUID id, StatutDemande statut, Map<String, Object> champs) {
        if (!COLONNES.containsAll(champs.keySet())) {
            throw new IllegalArgumentException("Colonne non modifiable : " + champs.keySet());
        }
        StringBuilder sql = new StringBuilder("update demandes.demande set statut = :statut");
        champs.keySet().forEach(k -> sql.append(", ").append(k).append(" = :").append(k));
        sql.append(" where id = :id");
        JdbcClient.StatementSpec spec = jdbc.sql(sql.toString()).param("statut", statut.name()).param("id", id);
        for (Map.Entry<String, Object> e : champs.entrySet()) {
            Object v = e.getValue() instanceof Instant i ? Timestamp.from(i) : e.getValue();
            spec = spec.param(e.getKey(), v);
        }
        spec.update();
    }

    public void ajouterEtape(UUID demandeId, Instant le, StatutDemande statut, String libelle) {
        jdbc.sql("insert into demandes.etape(demande_id, horodatage, statut, libelle) values (:d, :le, :statut, :libelle)")
                .param("d", demandeId).param("le", Timestamp.from(le)).param("statut", statut.name()).param("libelle", libelle)
                .update();
    }

    public List<SuiviDemande.Etape> etapes(UUID demandeId) {
        return jdbc.sql("select * from demandes.etape where demande_id = :d order by horodatage, id")
                .param("d", demandeId)
                .query((rs, n) -> new SuiviDemande.Etape(rs.getTimestamp("horodatage").toInstant(),
                        StatutDemande.valueOf(rs.getString("statut")), rs.getString("libelle")))
                .list();
    }

    public List<Demande> fileDeTravail() {
        return jdbc.sql("""
                        select * from demandes.demande where statut in ('A_TRAITER_PAR_AGENT', 'EN_ATTENTE_PIECE')
                        order by echeance nulls last, cree_le""")
                .query(this::lire).list();
    }

    public List<Demande> enCoursSurPersonne(UUID personneId) {
        return jdbc.sql("""
                        select * from demandes.demande where personne_rapprochee = :p
                          and statut in ('EN_TRAITEMENT', 'A_TRAITER_PAR_AGENT', 'EN_ATTENTE_PIECE')""")
                .param("p", personneId).query(this::lire).list();
    }

    private Demande lire(ResultSet rs, int n) throws SQLException {
        return new Demande(rs.getObject("id", UUID.class), rs.getString("numero_dossier"), rs.getString("empreinte_code_suivi"),
                ProfilDemandeur.valueOf(rs.getString("profil")),
                json.readValue(rs.getString("identite"), IdentiteDeclaree.class), rs.getString("demandeur_id"),
                rs.getBoolean("identite_verifiee"), StatutDemande.valueOf(rs.getString("statut")), rs.getLong("montant_fcfa"),
                rs.getBoolean("tarif_provisoire"), rs.getString("reference_paiement"), instant(rs, "cree_le"),
                instant(rs, "paye_le"), instant(rs, "echeance"), instant(rs, "suspendu_depuis"),
                rs.getObject("personne_rapprochee", UUID.class), rs.getString("issue_rapprochement"),
                rs.getString("explication_rapprochement"), rs.getString("motif_agent"), rs.getObject("bulletin_id", UUID.class),
                rs.getString("bulletin_numero"), rs.getString("motif_rejet"));
    }

    private static Instant instant(ResultSet rs, String colonne) throws SQLException {
        Timestamp t = rs.getTimestamp(colonne);
        return t == null ? null : t.toInstant();
    }
}
