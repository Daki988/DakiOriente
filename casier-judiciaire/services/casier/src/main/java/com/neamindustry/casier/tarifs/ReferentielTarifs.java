package com.neamindustry.casier.tarifs;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
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

/** ADM-04, RG-10 : les montants sont des données, jamais du code (ADR 0005). */
@Service
public class ReferentielTarifs {

    private final JdbcClient jdbc;
    private final Habilitations habilitations;
    private final JournalAudit journal;
    private final Clock horloge;

    ReferentielTarifs(JdbcClient jdbc, Habilitations habilitations, JournalAudit journal, Clock horloge) {
        this.jdbc = jdbc;
        this.habilitations = habilitations;
        this.journal = journal;
        this.horloge = horloge;
    }

    /** RG-10 : tarif validé en vigueur à la date du paiement. */
    @Transactional(readOnly = true)
    public Optional<Tarif> applicable(String acte, String profil, LocalDate date) {
        return jdbc.sql("""
                        select * from tarifs.tarif where acte = :acte and profil = :profil and statut = 'VALIDE' and date_effet <= :date
                        order by date_effet desc, valide_le desc limit 1""")
                .param("acte", acte).param("profil", profil).param("date", date)
                .query(this::lire).optional();
    }

    /** PUB-09 : tarifs en vigueur, pour affichage public. */
    @Transactional(readOnly = true)
    public List<Tarif> enVigueur(LocalDate date) {
        return jdbc.sql("""
                        select distinct on (acte, profil) * from tarifs.tarif
                        where statut = 'VALIDE' and date_effet <= :date
                        order by acte, profil, date_effet desc, valide_le desc""")
                .param("date", date).query(this::lire).list();
    }

    /** ADM-04 : proposition d'un tarif ; aucune modification rétroactive (date d'effet postérieure à aujourd'hui). */
    @Transactional
    public Tarif proposer(Acteur acteur, String acte, String profil, long montantFcfa, LocalDate dateEffet, boolean provisoire,
                          String libelle, String source) {
        habilitations.exiger(acteur, Permission.PROPOSER_TARIF);
        if (!dateEffet.isAfter(LocalDate.now(horloge))) {
            throw new ErreurMetier("ADM-04", "Aucune modification rétroactive : la date d'effet doit être postérieure à aujourd'hui.");
        }
        if (montantFcfa < 0) {
            throw new ErreurMetier("ADM-04", "Le montant ne peut pas être négatif.");
        }
        Tarif t = new Tarif(UUID.randomUUID(), acte, profil, montantFcfa, dateEffet, Tarif.Statut.PROPOSE, provisoire, libelle,
                source, acteur.identifiant(), null);
        inserer(t, Instant.now(horloge), null);
        journal.enregistrer(EvenementAudit.par(acteur, "TARIF_PROPOSE", "Tarif", t.id().toString(), null, source,
                Map.of("acte", acte, "profil", profil, "montant", String.valueOf(montantFcfa), "dateEffet", dateEffet.toString())));
        return t;
    }

    /** ADM-04 : validation par une seconde personne habilitée. */
    @Transactional
    public void valider(Acteur valideur, UUID id) {
        habilitations.exiger(valideur, Permission.VALIDER_TARIF);
        Tarif t = jdbc.sql("select * from tarifs.tarif where id = :id").param("id", id).query(this::lire).optional()
                .orElseThrow(() -> new RessourceIntrouvable("Tarif introuvable."));
        if (t.statut() != Tarif.Statut.PROPOSE) {
            throw new ErreurMetier(ErreurMetier.Nature.CONFLIT, "ADM-04", "Ce tarif n'est plus en attente de validation.");
        }
        habilitations.exigerQuatreYeux(t.proposePar(), valideur);
        if (!t.dateEffet().isAfter(LocalDate.now(horloge))) {
            throw new ErreurMetier("ADM-04", "La date d'effet est atteinte : proposez un nouveau tarif.");
        }
        jdbc.sql("update tarifs.tarif set statut = 'VALIDE', valide_par = :par, valide_le = :le where id = :id")
                .param("par", valideur.identifiant()).param("le", Timestamp.from(Instant.now(horloge))).param("id", id).update();
        journal.enregistrer(EvenementAudit.par(valideur, "TARIF_VALIDE", "Tarif", id.toString(), null, null,
                Map.of("acte", t.acte(), "profil", t.profil(), "montant", String.valueOf(t.montantFcfa()))));
    }

    /** ADM-22 : chargement du référentiel initial d'un environnement vide (barème provisoire de démonstration). */
    @Transactional
    public int importerInitial(String source, List<Tarif> tarifs) {
        long existants = jdbc.sql("select count(*) from tarifs.tarif").query(Long.class).single();
        if (existants > 0) {
            throw new ErreurMetier("ADM-22", "Le référentiel des tarifs n'est pas vide : utilisez le circuit de validation.");
        }
        Instant maintenant = Instant.now(horloge);
        for (Tarif t : tarifs) {
            inserer(new Tarif(UUID.randomUUID(), t.acte(), t.profil(), t.montantFcfa(), t.dateEffet(), Tarif.Statut.VALIDE,
                    t.provisoire(), t.libelle(), t.source(), "import:" + source, "import:" + source), maintenant, maintenant);
        }
        journal.enregistrer(new EvenementAudit("import:" + source, "", "TARIFS_IMPORTES", "ReferentielTarifs", source, null,
                null, Map.of("lignes", String.valueOf(tarifs.size()))));
        return tarifs.size();
    }

    private void inserer(Tarif t, Instant proposeLe, Instant valideLe) {
        jdbc.sql("""
                        insert into tarifs.tarif(id, acte, profil, montant_fcfa, date_effet, statut, provisoire, libelle, source,
                            propose_par, propose_le, valide_par, valide_le)
                        values (:id, :acte, :profil, :montant, :dateEffet, :statut, :provisoire, :libelle, :source,
                            :proposePar, :proposeLe, :validePar, :valideLe)""")
                .param("id", t.id()).param("acte", t.acte()).param("profil", t.profil()).param("montant", t.montantFcfa())
                .param("dateEffet", t.dateEffet()).param("statut", t.statut().name()).param("provisoire", t.provisoire())
                .param("libelle", t.libelle()).param("source", t.source()).param("proposePar", t.proposePar())
                .param("proposeLe", Timestamp.from(proposeLe)).param("validePar", t.validePar())
                .param("valideLe", valideLe == null ? null : Timestamp.from(valideLe))
                .update();
    }

    private Tarif lire(ResultSet rs, int n) throws SQLException {
        return new Tarif(rs.getObject("id", UUID.class), rs.getString("acte"), rs.getString("profil"), rs.getLong("montant_fcfa"),
                rs.getObject("date_effet", LocalDate.class), Tarif.Statut.valueOf(rs.getString("statut")),
                rs.getBoolean("provisoire"), rs.getString("libelle"), rs.getString("source"), rs.getString("propose_par"),
                rs.getString("valide_par"));
    }
}
