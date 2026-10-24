package com.neamindustry.casier;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

/** Pré-plainte en ligne : dépôt public, suivi par numéro et code, rendez-vous puis signature constatée par l'OPJ. */
class PreplaintesIntegrationTest extends TestIntegration {

    private Map<String, Object> preplainte(String description, LocalDate date) {
        Map<String, Object> p = new HashMap<>();
        p.put("nature", "VOL");
        p.put("dateFaits", date.toString());
        p.put("heureFaits", "vers 18 h");
        p.put("ville", "Libreville");
        p.put("lieu", "Marché de Mont-Bouët");
        p.put("description", description);
        p.put("auteurConnu", false);
        p.put("biens", "Téléphone portable, portefeuille");
        p.put("prejudiceFcfa", 180000);
        p.put("declarant", Map.of("nom", "Moussavou fictif", "prenoms", "Anne", "dateNaissance", "1990-04-04", "telephone", "+241 77 12 34 56"));
        p.put("service", "Commissariat central de Libreville");
        return p;
    }

    @Test
    @DisplayName("Pré-plainte : récépissé avec code, suivi public, rendez-vous puis plainte signée ; traitement réservé à l'OPJ")
    void parcours() throws Exception {
        mvc.perform(post("/api/public/v1/pre-plaintes").contentType(MediaType.APPLICATION_JSON)
                .content(enJson(preplainte("court", LocalDate.now().minusDays(1))))).andExpect(status().is(422));
        mvc.perform(post("/api/public/v1/pre-plaintes").contentType(MediaType.APPLICATION_JSON)
                .content(enJson(preplainte("On m'a arraché mon sac au marché vers 18 heures.", LocalDate.now().plusDays(2))))).andExpect(status().is(422));
        String r = mvc.perform(post("/api/public/v1/pre-plaintes").contentType(MediaType.APPLICATION_JSON)
                        .content(enJson(preplainte("On m'a arraché mon sac au marché vers 18 heures, deux hommes à moto.", LocalDate.now().minusDays(1)))))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        String numero = json.readTree(r).get("numero").asString();
        String code = json.readTree(r).get("code").asString();
        assertThat(numero).matches("PP-\\d{4}-\\d{6}");
        assertThat(code).matches("\\d{6}");

        mvc.perform(get("/api/public/v1/pre-plaintes/suivi").param("numero", numero).param("code", "000000x")).andExpect(status().isNotFound());
        mvc.perform(get("/api/public/v1/pre-plaintes/suivi").param("numero", numero.toLowerCase()).param("code", code))
                .andExpect(status().isOk()).andExpect(jsonPath("$.statut").value("RECUE")).andExpect(jsonPath("$.description").doesNotExist());

        mvc.perform(get("/api/v1/pre-plaintes").with(agent("agent-pp"))).andExpect(status().isForbidden());
        String file = mvc.perform(get("/api/v1/pre-plaintes").with(acteur("opj-1", null, false, "R15")))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        String id = null;
        for (var n : json.readTree(file)) {
            if (n.get("numero").asString().equals(numero)) {
                id = n.get("id").asString();
                assertThat(n.get("declarant").get("nom").asString()).isEqualTo("MOUSSAVOU FICTIF");
            }
        }
        assertThat(id).isNotNull();
        mvc.perform(get("/api/v1/pre-plaintes").with(acteur("dir-pp", null, false, "R08"))).andExpect(status().isOk());

        Map<String, Object> rdv = Map.of("le", Instant.now().plus(2, ChronoUnit.DAYS).toString(), "lieu", "Commissariat central, bureau des plaintes");
        mvc.perform(post("/api/v1/pre-plaintes/{id}/rendez-vous", id).with(acteur("dir-pp", null, false, "R08"))
                .contentType(MediaType.APPLICATION_JSON).content(enJson(rdv))).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/pre-plaintes/{id}/rendez-vous", id).with(acteur("opj-1", null, false, "R15"))
                .contentType(MediaType.APPLICATION_JSON).content(enJson(rdv))).andExpect(status().isNoContent());
        mvc.perform(get("/api/public/v1/pre-plaintes/suivi").param("numero", numero).param("code", code))
                .andExpect(jsonPath("$.statut").value("RENDEZ_VOUS_FIXE")).andExpect(jsonPath("$.rendezVousLieu").value("Commissariat central, bureau des plaintes"));
        mvc.perform(post("/api/v1/pre-plaintes/{id}/signature", id).with(acteur("opj-1", null, false, "R15"))
                .contentType(MediaType.APPLICATION_JSON).content(enJson(Map.of("numeroProcedure", "PV-2026-0457")))).andExpect(status().isNoContent());
        mvc.perform(post("/api/v1/pre-plaintes/{id}/signature", id).with(acteur("opj-1", null, false, "R15"))
                .contentType(MediaType.APPLICATION_JSON).content(enJson(Map.of("numeroProcedure", "PV-2026-0458")))).andExpect(status().isConflict());
        mvc.perform(get("/api/public/v1/pre-plaintes/suivi").param("numero", numero).param("code", code))
                .andExpect(jsonPath("$.statut").value("PLAINTE_SIGNEE"));
        assertThat(jdbc.sql("select count(*) from audit.journal where action like 'PREPLAINTE_%' and objet_id = :id").param("id", id)
                .query(Long.class).single()).isEqualTo(3);
    }
}
