package com.neamindustry.casier;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.hamcrest.Matchers;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import com.neamindustry.casier.commun.NaturePeine;
import com.neamindustry.casier.commun.Peine;
import com.neamindustry.casier.commun.Qualification;
import com.neamindustry.casier.commun.Sursis;
import com.neamindustry.casier.demandes.DemandeDeposee;
import com.neamindustry.casier.demandes.ServiceDemandes;
import com.neamindustry.casier.registre.IdentitePersonne;
import com.neamindustry.casier.registre.SaisieCondamnation;

/** DSH-01, DSH-06, DSH-07, ADM-04, ADM-05, NOT-01 : API des espaces connectés. */
class EspacesIntegrationTest extends TestIntegration {

    @Autowired
    private ServiceDemandes demandes;

    @Test
    @DisplayName("DSH-01, NOT-01 : l'usager voit ses seules demandes, sa frise, son bulletin et ses avis (lien, jamais le contenu)")
    void monEspace() throws Exception {
        String r = mvc.perform(post("/api/v1/demandes").with(usager("usager-espace")).contentType(MediaType.APPLICATION_JSON)
                        .content(enJson(Map.of("profil", "GABONAIS_NE_AU_GABON", "telephone", "+241 77 12 34 56", "email", "fictif@exemple.ga",
                                "identite", Map.of("nom", "IBINGA FICTIF", "prenoms", "Laure", "dateNaissance", "1993-05-06",
                                        "lieuNaissance", "Lambaréné")))))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        DemandeDeposee d = lire(r, DemandeDeposee.class);
        demandes.confirmerPaiement(d.numeroDossier(), "TEST-" + UUID.randomUUID(), 1500, Instant.now());

        mvc.perform(get("/api/v1/usager/demandes").with(usager("usager-espace")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].statut").value("DELIVREE"))
                .andExpect(jsonPath("$[0].bulletinId").isNotEmpty())
                .andExpect(jsonPath("$[0].frise.length()").value(3))
                .andExpect(jsonPath("$[0].avis[0].canal").value("SMS"))
                .andExpect(jsonPath("$[0].avis[?(@.message =~ /.*\\/espace.*/)]").isNotEmpty())
                .andExpect(jsonPath("$[0].avis[*].message", Matchers.everyItem(Matchers.containsString("jamais de code"))));
        mvc.perform(get("/api/v1/usager/demandes").with(usager("un-autre"))).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(get("/api/v1/usager/demandes").with(agent("agent-1"))).andExpect(status().isForbidden());
        String journal = jdbc.sql("select string_agg(destination, ',') from demandes.notification").query(String.class).single();
        assertThat(journal).doesNotContain("12 34 56").doesNotContain("fictif@");
    }

    @Test
    @DisplayName("DSH-06 : le greffier voit les inscriptions à valider de sa seule juridiction")
    void validationsEnAttente() throws Exception {
        SaisieCondamnation s = new SaisieCondamnation(null,
                new IdentitePersonne("NGUEMA FICTIF", "Éric", LocalDate.of(1980, 2, 2), "Oyem", "Gabon", null, null, List.of(), null, null, List.of()),
                JURIDICTION, LocalDate.of(2024, 1, 15), "JUG-ATT-" + UUID.randomUUID(), "Infraction fictive", Qualification.DELIT,
                List.of(new Peine(NaturePeine.EMPRISONNEMENT, 2, null, Sursis.AUCUN, null)), LocalDate.of(2024, 3, 1), "PIECE");
        mvc.perform(post("/api/v1/registre/condamnations").with(agent("agent-attente")).contentType(MediaType.APPLICATION_JSON)
                .content(enJson(s))).andExpect(status().isCreated());
        mvc.perform(get("/api/v1/registre/inscriptions-en-attente").with(greffier("greffier-attente")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.nom == 'NGUEMA FICTIF')].saisieParMoi").value(Matchers.contains(false)));
        mvc.perform(get("/api/v1/registre/inscriptions-en-attente").with(acteur("greffier-pog", "TPI-PORT-GENTIL", false, "R07")))
                .andExpect(jsonPath("$[?(@.nom == 'NGUEMA FICTIF')]").isEmpty());
        mvc.perform(get("/api/v1/registre/inscriptions-en-attente").with(agent("agent-attente"))).andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("DSH-07, ADM-04, ADM-05 : pilotage agrégé, tarifs et paramètres juridiques réservés aux profils habilités")
    void pilotageEtBackOffice() throws Exception {
        mvc.perform(get("/api/v1/pilotage/indicateurs").with(acteur("direction-1", null, false, "R08")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.demandes.total").isNumber())
                .andExpect(jsonPath("$.verifications").isNumber());
        mvc.perform(get("/api/v1/pilotage/indicateurs").with(acteur("decideur-1", null, false, "R09"))).andExpect(status().isOk());
        mvc.perform(get("/api/v1/pilotage/indicateurs").with(usager("u"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/tarifs").with(acteur("admin-1", null, false, "R13")))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].statut").value("VALIDE"));
        mvc.perform(get("/api/v1/tarifs").with(usager("u"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/regles").with(acteur("magistrat-1", null, false, "R05")))
                .andExpect(status().isOk()).andExpect(jsonPath("$[?(@.statut == 'PUBLIE')]").isNotEmpty());
        mvc.perform(get("/api/v1/regles").with(agent("a"))).andExpect(status().isForbidden());
    }
}
