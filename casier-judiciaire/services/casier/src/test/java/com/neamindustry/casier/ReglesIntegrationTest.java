package com.neamindustry.casier;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.ObjectNode;

/** ADM-05, ADR 0005 : paramètres juridiques versionnés, cas de test obligatoires, validation par un magistrat distinct. */
class ReglesIntegrationTest extends TestIntegration {

    private static final String DIRECTION = "R08";
    private static final String MAGISTRAT = "R05";

    private ObjectNode proposition(LocalDate dateEffet, boolean casFaux) throws Exception {
        JsonNode fichier = json.readTree(Files.readString(Path.of("../../referentiels/regles-bulletins-fictives.json")));
        ObjectNode p = json.createObjectNode();
        p.set("contenu", fichier.get("contenu"));
        p.put("dateEffet", dateEffet.toString());
        p.set("casDeTest", fichier.get("casDeTest").deepCopy());
        if (casFaux) {
            ((ObjectNode) p.get("casDeTest").get(0)).set("retenuesAttendues", json.createArrayNode().add("C1"));
        }
        return p;
    }

    private String proposer(String sujet, ObjectNode p, int statutAttendu, String... roles) throws Exception {
        var r = mvc.perform(post("/api/v1/regles").with(acteur(sujet, null, false, roles)).contentType(MediaType.APPLICATION_JSON)
                .content(enJson(p))).andExpect(status().is(statutAttendu)).andReturn().getResponse().getContentAsString();
        return statutAttendu == 201 ? json.readTree(r).get("id").asString() : null;
    }

    @Test
    @DisplayName("ADM-05 : proposition par la direction centrale, publication par un magistrat distinct")
    void propositionPuisPublication() throws Exception {
        String id = proposer("direction-1", proposition(LocalDate.now().plusDays(1), false), 201, DIRECTION);
        mvc.perform(get("/api/v1/regles/{id}", id).with(acteur("direction-1", null, false, DIRECTION)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.statut").value("PROPOSE"));
        mvc.perform(post("/api/v1/regles/{id}/validation", id).with(acteur("direction-1", null, false, DIRECTION)))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/regles/{id}/validation", id).with(acteur("magistrat-1", null, false, MAGISTRAT)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.statut").value("PUBLIE"));
        mvc.perform(post("/api/v1/regles/{id}/validation", id).with(acteur("magistrat-1", null, false, MAGISTRAT)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("HAB-02 : l'auteur d'une proposition ne la valide pas lui-même, même s'il en a le rôle")
    void quatreYeux() throws Exception {
        String id = proposer("double-role", proposition(LocalDate.now().plusDays(2), false), 201, DIRECTION, MAGISTRAT);
        mvc.perform(post("/api/v1/regles/{id}/validation", id).with(acteur("double-role", null, false, DIRECTION, MAGISTRAT)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("ADM-05 : cas de test en échec, publication refusée ; rejet motivé ; date passée et tests absents refusés")
    void garde_fous() throws Exception {
        String id = proposer("direction-2", proposition(LocalDate.now().plusDays(3), true), 201, DIRECTION);
        mvc.perform(post("/api/v1/regles/{id}/validation", id).with(acteur("magistrat-2", null, false, MAGISTRAT)))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("Cas de test en échec")));
        mvc.perform(post("/api/v1/regles/{id}/rejet", id).with(acteur("magistrat-2", null, false, MAGISTRAT))
                .contentType(MediaType.APPLICATION_JSON).content(enJson(Map.of("motif", "Cas de test incohérent")))).andExpect(status().isNoContent());
        mvc.perform(post("/api/v1/regles/{id}/rejet", id).with(acteur("magistrat-2", null, false, MAGISTRAT))
                .contentType(MediaType.APPLICATION_JSON).content(enJson(Map.of("motif", "Encore")))).andExpect(status().isConflict());

        proposer("direction-2", proposition(LocalDate.now().minusDays(1), false), 422, DIRECTION);
        ObjectNode sansCas = proposition(LocalDate.now().plusDays(4), false);
        sansCas.set("casDeTest", json.createArrayNode());
        proposer("direction-2", sansCas, 422, DIRECTION);
        proposer("agent-1", proposition(LocalDate.now().plusDays(4), false), 403, "R06");
    }
}
