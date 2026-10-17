package com.neamindustry.casier.audit.interne;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.neamindustry.casier.audit.EntreeJournal;
import com.neamindustry.casier.audit.EvenementAudit;
import com.neamindustry.casier.audit.JournalAudit;
import com.neamindustry.casier.audit.ResultatIntegrite;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

@Service
class JournalAuditJdbc implements JournalAudit {

    private static final TypeReference<Map<String, String>> CARTE = new TypeReference<>() {
    };

    private final JdbcClient jdbc;
    private final Clock horloge;
    private final JsonMapper json;

    JournalAuditJdbc(JdbcClient jdbc, Clock horloge, JsonMapper json) {
        this.jdbc = jdbc;
        this.horloge = horloge;
        this.json = json;
    }

    @Override
    @Transactional
    public EntreeJournal enregistrer(EvenementAudit e) {
        // La tête de chaîne est verrouillée : les écritures concurrentes sont sérialisées (ADR 0003).
        record Tete(long numero, String empreinte) {
        }
        Tete tete = jdbc.sql("select numero, empreinte from audit.tete_chaine where id = 1 for update")
                .query((rs, i) -> new Tete(rs.getLong(1), rs.getString(2))).single();
        long numero = tete.numero() + 1;
        Instant horodatage = Instant.now(horloge).truncatedTo(ChronoUnit.MICROS);
        String empreinte = CalculEmpreinte.empreinte(tete.empreinte(), numero, horodatage, e);
        jdbc.sql("""
                        insert into audit.journal(numero, horodatage, acteur_id, roles, action, objet_type, objet_id,
                                                  personne_concernee, finalite, details, empreinte_precedente, empreinte)
                        values (:numero, :horodatage, :acteur, :roles, :action, :objetType, :objetId,
                                :personne, :finalite, cast(:details as jsonb), :precedente, :empreinte)""")
                .param("numero", numero)
                .param("horodatage", Timestamp.from(horodatage))
                .param("acteur", e.acteurId())
                .param("roles", e.roles())
                .param("action", e.action())
                .param("objetType", e.objetType())
                .param("objetId", e.objetId())
                .param("personne", e.personneConcernee())
                .param("finalite", e.finalite())
                .param("details", json.writeValueAsString(e.details()))
                .param("precedente", tete.empreinte())
                .param("empreinte", empreinte)
                .update();
        jdbc.sql("update audit.tete_chaine set numero = :numero, empreinte = :empreinte where id = 1")
                .param("numero", numero)
                .param("empreinte", empreinte)
                .update();
        return new EntreeJournal(numero, horodatage, e, tete.empreinte(), empreinte);
    }

    @Override
    @Transactional(readOnly = true)
    public ResultatIntegrite verifierIntegrite() {
        AtomicReference<String> precedente = new AtomicReference<>(CalculEmpreinte.ORIGINE);
        AtomicLong verifiees = new AtomicLong();
        AtomicReference<Long> alteration = new AtomicReference<>();
        jdbc.sql("select * from audit.journal order by numero").query(rs -> {
            if (alteration.get() != null) {
                return;
            }
            EntreeJournal entree = lire(rs);
            String attendue = CalculEmpreinte.empreinte(precedente.get(), entree.numero(), entree.horodatage(), entree.evenement());
            boolean continuite = entree.numero() == verifiees.get() + 1;
            if (!continuite || !entree.empreintePrecedente().equals(precedente.get()) || !entree.empreinte().equals(attendue)) {
                alteration.set(entree.numero());
                return;
            }
            precedente.set(entree.empreinte());
            verifiees.incrementAndGet();
        });
        if (alteration.get() == null) {
            String tete = jdbc.sql("select empreinte from audit.tete_chaine where id = 1").query(String.class).single();
            if (!tete.equals(precedente.get())) {
                // Des entrées ont été retirées en fin de chaîne.
                alteration.set(verifiees.get() + 1);
            }
        }
        return new ResultatIntegrite(alteration.get() == null, verifiees.get(), alteration.get());
    }

    @Override
    @Transactional(readOnly = true)
    public List<EntreeJournal> dernieres(int nombre) {
        return jdbc.sql("select * from audit.journal order by numero desc limit :n")
                .param("n", nombre)
                .query((rs, i) -> lire(rs)).list();
    }

    @Override
    @Transactional(readOnly = true)
    public List<EntreeJournal> parPersonneConcernee(String personneId) {
        return jdbc.sql("select * from audit.journal where personne_concernee = :p order by numero")
                .param("p", personneId)
                .query((rs, i) -> lire(rs)).list();
    }

    @Override
    @Transactional(readOnly = true)
    public List<EntreeJournal> parObjetsOuPersonnes(java.util.Collection<String> objets, java.util.Collection<String> personnes) {
        if (objets.isEmpty() && personnes.isEmpty()) {
            return List.of();
        }
        return jdbc.sql("""
                        select * from audit.journal
                        where objet_id = any(:objets) or personne_concernee = any(:personnes)
                        order by numero""")
                .param("objets", objets.toArray(String[]::new)).param("personnes", personnes.toArray(String[]::new))
                .query((rs, i) -> lire(rs)).list();
    }

    private EntreeJournal lire(ResultSet rs) throws SQLException {
        EvenementAudit e = new EvenementAudit(rs.getString("acteur_id"), rs.getString("roles"), rs.getString("action"),
                rs.getString("objet_type"), rs.getString("objet_id"), rs.getString("personne_concernee"),
                rs.getString("finalite"), json.readValue(rs.getString("details"), CARTE));
        return new EntreeJournal(rs.getLong("numero"), rs.getTimestamp("horodatage").toInstant(), e,
                rs.getString("empreinte_precedente"), rs.getString("empreinte"));
    }
}
