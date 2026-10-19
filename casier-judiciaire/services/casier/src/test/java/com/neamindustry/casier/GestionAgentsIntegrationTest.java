package com.neamindustry.casier;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import com.neamindustry.casier.agents.AnnuaireAgents;
import com.neamindustry.casier.agents.CompteAgent;
import com.neamindustry.casier.agents.NouvelAgent;

/** Gestion des comptes des agents par l'administrateur, sur un annuaire en mémoire à la place de Keycloak. */
@Import(GestionAgentsIntegrationTest.AnnuaireDeTest.class)
class GestionAgentsIntegrationTest extends TestIntegration {

    @TestConfiguration
    static class AnnuaireDeTest {
        @Bean
        @Primary
        AnnuaireAgents annuaireEnMemoire() {
            return new EnMemoire();
        }
    }

    static class EnMemoire implements AnnuaireAgents {
        final Map<String, CompteAgent> comptes = new ConcurrentHashMap<>();

        EnMemoire() {
            comptes.put("admin-g", new CompteAgent("admin-g", "admin", "Ada", "ADMIN", "a@exemple.ga", "R13", null, true, Instant.now()));
        }

        @Override
        public List<CompteAgent> comptes(Set<String> roles) {
            return new ArrayList<>(comptes.values().stream().filter(c -> roles.contains(c.role())).toList());
        }

        @Override
        public Optional<CompteAgent> compte(String id) {
            return Optional.ofNullable(comptes.get(id));
        }

        @Override
        public CompteAgent creer(NouvelAgent a, String motDePasse) {
            if (comptes.values().stream().anyMatch(c -> c.login().equals(a.login()))) {
                throw new com.neamindustry.casier.commun.ErreurMetier(com.neamindustry.casier.commun.ErreurMetier.Nature.CONFLIT, "AGT-01", "Déjà utilisé.");
            }
            CompteAgent c = new CompteAgent(UUID.randomUUID().toString(), a.login(), a.prenom(), a.nom(), a.email(), a.role(), a.juridiction(), true, Instant.now());
            comptes.put(c.identifiant(), c);
            return c;
        }

        @Override
        public void changerRole(String id, String ancien, String nouveau) {
            CompteAgent c = comptes.get(id);
            comptes.put(id, new CompteAgent(id, c.login(), c.prenom(), c.nom(), c.email(), nouveau, c.juridiction(), c.actif(), c.creeLe()));
        }

        @Override
        public void changerJuridiction(String id, String juridiction) {
            CompteAgent c = comptes.get(id);
            comptes.put(id, new CompteAgent(id, c.login(), c.prenom(), c.nom(), c.email(), c.role(), juridiction, c.actif(), c.creeLe()));
        }

        @Override
        public void activer(String id, boolean actif) {
            CompteAgent c = comptes.get(id);
            comptes.put(id, new CompteAgent(id, c.login(), c.prenom(), c.nom(), c.email(), c.role(), c.juridiction(), actif, c.creeLe()));
        }
    }

    private static RequestPostProcessor admin() {
        return acteur("admin-g", null, false, "R13");
    }

    private String creer(Map<String, Object> corps, int attendu) throws Exception {
        return mvc.perform(post("/api/v1/agents").with(admin()).contentType(MediaType.APPLICATION_JSON).content(enJson(corps)))
                .andExpect(status().is(attendu)).andReturn().getResponse().getContentAsString();
    }

    @Test
    @DisplayName("Agents : création avec mot de passe provisoire, changement de rôle, désactivation motivée ; règles de sécurité")
    void cycleDeVie() throws Exception {
        mvc.perform(get("/api/v1/agents/roles").with(admin())).andExpect(jsonPath("$.R06").value("Agent du casier (greffe)"))
                .andExpect(jsonPath("$.R13").doesNotExist()).andExpect(jsonPath("$.R01").doesNotExist());

        creer(Map.of("login", "x", "prenom", "Jo", "nom", "Test", "email", "jo@exemple.ga", "role", "R06", "juridiction", "TPI-LIBREVILLE"), 422);
        creer(Map.of("login", "jo.mba", "prenom", "Jo", "nom", "Mba", "email", "jo@exemple.ga", "role", "R06"), 422);
        creer(Map.of("login", "chef.it", "prenom", "Jo", "nom", "Mba", "email", "chef@exemple.ga", "role", "R13"), 403);
        String r = creer(Map.of("login", "Jo.Mba", "prenom", "Jo", "nom", "Mba", "email", "Jo@Exemple.ga", "role", "R06",
                "juridiction", "tpi-libreville"), 201);
        var cree = json.readTree(r);
        assertThat(cree.get("motDePasseProvisoire").asString()).hasSize(16);
        assertThat(cree.get("compte").get("login").asString()).isEqualTo("jo.mba");
        assertThat(cree.get("compte").get("nom").asString()).isEqualTo("MBA");
        assertThat(cree.get("compte").get("juridiction").asString()).isEqualTo("TPI-LIBREVILLE");
        String id = cree.get("compte").get("identifiant").asString();
        creer(Map.of("login", "jo.mba", "prenom", "Jo", "nom", "Mba", "email", "jo2@exemple.ga", "role", "R10"), 409);

        mvc.perform(post("/api/v1/agents/{id}/role", id).with(admin()).contentType(MediaType.APPLICATION_JSON)
                .content(enJson(Map.of("role", "R10")))).andExpect(status().isNoContent());
        mvc.perform(post("/api/v1/agents/{id}/activation", id).with(admin()).contentType(MediaType.APPLICATION_JSON)
                .content(enJson(Map.of("actif", false)))).andExpect(status().is(422));
        mvc.perform(post("/api/v1/agents/{id}/activation", id).with(admin()).contentType(MediaType.APPLICATION_JSON)
                .content(enJson(Map.of("actif", false, "motif", "Départ du service")))).andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/agents").with(admin()))
                .andExpect(jsonPath("$[?(@.identifiant == '" + id + "')].role").value(org.hamcrest.Matchers.contains("R10")))
                .andExpect(jsonPath("$[?(@.identifiant == '" + id + "')].actif").value(org.hamcrest.Matchers.contains(false)))
                .andExpect(jsonPath("$[?(@.identifiant == 'admin-g')]").isEmpty());

        mvc.perform(post("/api/v1/agents/{id}/activation", "admin-g").with(admin()).contentType(MediaType.APPLICATION_JSON)
                .content(enJson(Map.of("actif", false, "motif", "essai")))).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/agents").with(greffier("greffier-g")).contentType(MediaType.APPLICATION_JSON)
                .content(enJson(Map.of("login", "z.z", "prenom", "Z", "nom", "Z", "email", "z@exemple.ga", "role", "R06")))).andExpect(status().isForbidden());
        assertThat(jdbc.sql("select count(*) from audit.journal where action like 'AGENT_%' and objet_id = :id").param("id", id)
                .query(Long.class).single()).isEqualTo(3);
    }
}
