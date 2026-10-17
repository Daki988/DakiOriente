package com.neamindustry.casier;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import com.neamindustry.casier.commun.NaturePeine;
import com.neamindustry.casier.commun.Peine;
import com.neamindustry.casier.commun.Qualification;
import com.neamindustry.casier.commun.Sursis;
import com.neamindustry.casier.registre.IdentitePersonne;
import com.neamindustry.casier.registre.SaisieCondamnation;

/** SEC-07, ENF-12, REG-04, REG-05, REG-08 : journal inaltérable et registre sans suppression ni réécriture. */
class IntegriteIntegrationTest extends TestIntegration {

    private UUID saisirCondamnation(String nom) throws Exception {
        SaisieCondamnation s = new SaisieCondamnation(null,
                new IdentitePersonne(nom, "Test", LocalDate.of(1970, 1, 1), "Franceville", "Gabon", null, null, List.of(), null, null, List.of()),
                JURIDICTION, LocalDate.of(2022, 2, 2), "JUG-" + UUID.randomUUID(), "Infraction fictive", Qualification.DELIT,
                List.of(new Peine(NaturePeine.AMENDE, null, 50_000L, Sursis.AUCUN, null)), LocalDate.of(2022, 4, 1), "PIECE-FICTIVE");
        String r = mvc.perform(post("/api/v1/registre/condamnations").with(agent("agent-integrite"))
                .contentType(MediaType.APPLICATION_JSON).content(enJson(s))).andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return UUID.fromString(json.readTree(r).get("id").asString());
    }

    @Test
    @DisplayName("ENF-12, ADR 0003 : chaque action est journalisée ; la chaîne est intègre ; seul l'auditeur la lit")
    void chaineIntegre() throws Exception {
        saisirCondamnation("JOURNAL FICTIF");
        mvc.perform(get("/api/v1/audit/integrite").with(agent("agent-1"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/audit/integrite").with(auditeur()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.integre").value(true));
        mvc.perform(get("/api/v1/audit/entrees").param("nombre", "5").with(auditeur()))
                .andExpect(status().isOk())
                // La consultation du journal est elle-même journalisée, avant la lecture (SEC-07).
                .andExpect(jsonPath("$[0].evenement.action").value("JOURNAL_CONSULTE"))
                .andExpect(jsonPath("$[1].evenement.action").value("JOURNAL_INTEGRITE_VERIFIEE"));
    }

    @Test
    @DisplayName("SEC-07 : modification et suppression du journal refusées par la base")
    void journalEnAjoutSeul() {
        assertThatThrownBy(() -> jdbc.sql("update audit.journal set action = 'X' where numero = 1").update())
                .hasMessageContaining("SEC-07");
        assertThatThrownBy(() -> jdbc.sql("delete from audit.journal where numero = 1").update())
                .hasMessageContaining("SEC-07");
    }

    @Test
    @DisplayName("ADR 0003 : une falsification directe en base (déclencheurs désactivés) est détectée et localisée")
    void falsificationDetectee() throws Exception {
        saisirCondamnation("FALSIFICATION FICTIF");
        long numero = jdbc.sql("select max(numero) from audit.journal").query(Long.class).single();
        String action = jdbc.sql("select action from audit.journal where numero = :n").param("n", numero).query(String.class).single();
        try {
            jdbc.sql("alter table audit.journal disable trigger journal_ajout_seul").update();
            jdbc.sql("update audit.journal set action = 'FALSIFIEE' where numero = :n").param("n", numero).update();
            mvc.perform(get("/api/v1/audit/integrite").with(auditeur()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.integre").value(false))
                    .andExpect(jsonPath("$.premiereAlteration").value(numero));
        } finally {
            jdbc.sql("update audit.journal set action = :a where numero = :n").param("a", action).param("n", numero).update();
            jdbc.sql("alter table audit.journal enable trigger journal_ajout_seul").update();
        }
    }

    @Test
    @DisplayName("REG-08 : aucune suppression physique dans le registre ; REG-04 : contenu d'une inscription figé")
    void registreSansSuppressionNiReecriture() throws Exception {
        UUID id = saisirCondamnation("REGISTRE FICTIF");
        assertThatThrownBy(() -> jdbc.sql("delete from registre.condamnation where id = :id").param("id", id).update())
                .hasMessageContaining("REG-08");
        assertThatThrownBy(() -> jdbc.sql("update registre.condamnation set infraction = 'autre' where id = :id").param("id", id).update())
                .hasMessageContaining("REG-04");
    }

    @Test
    @DisplayName("REG-05 : une ligne modifiée hors application est refusée à la lecture (empreinte)")
    void empreinteControleeALaLecture() throws Exception {
        UUID id = saisirCondamnation("EMPREINTE FICTIF");
        UUID personne = jdbc.sql("select personne_id from registre.condamnation where id = :id").param("id", id).query(UUID.class).single();
        jdbc.sql("update registre.personne set prenoms = 'Modifié' where id = :id").param("id", personne).update();
        mvc.perform(get("/api/v1/registre/personnes/{id}", personne).param("motif", "Contrôle").with(greffier("greffier-1")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("REG-09"));
        assertThat(jdbc.sql("select count(*) from registre.personne where id = :id").param("id", personne).query(Long.class).single())
                .isEqualTo(1);
    }
}
