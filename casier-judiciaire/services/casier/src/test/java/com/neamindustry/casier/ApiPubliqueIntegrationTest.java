package com.neamindustry.casier;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.hamcrest.Matchers;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

/** PUB-08, PUB-09, SEC-04, BUL-09 : points d'accès publics. */
class ApiPubliqueIntegrationTest extends TestIntegration {

    @Test
    @DisplayName("PUB-09, ADR 0005 : tarifs lus dans le référentiel importé, provisoires, sans donnée interne")
    void tarifs() throws Exception {
        mvc.perform(get("/api/public/v1/tarifs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.acte == 'BULLETIN_N3' && @.profil == 'GABONAIS_NE_AU_GABON')].montantFcfa").value(Matchers.contains(1500)))
                .andExpect(jsonPath("$[0].provisoire").value(true))
                .andExpect(jsonPath("$[0].proposePar").doesNotExist())
                .andExpect(jsonPath("$[0].id").doesNotExist());
    }

    @Test
    @DisplayName("SEC-01, SEC-04 : API interne fermée sans jeton ; en-têtes de sécurité présents")
    void securite() throws Exception {
        mvc.perform(get("/api/v1/demandes/file")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/public/v1/tarifs"))
                .andExpect(header().string("Content-Security-Policy", Matchers.containsString("frame-ancestors 'none'")))
                .andExpect(header().string("Referrer-Policy", "no-referrer"));
    }

    @Test
    @DisplayName("BUL-09 : au-delà de la limite par adresse réseau, la vérification répond 429")
    void limitationDeDebit() throws Exception {
        // Fenêtre d'une minute calendaire : la boucle couvre deux fenêtres si la minute change pendant le test.
        int refus = 0;
        for (int i = 0; i < 2010 && refus == 0; i++) {
            int statut = mvc.perform(post("/api/public/v1/verifications/code").contentType(MediaType.APPLICATION_JSON)
                            .content("{\"code\":\"AAAA-BBBB-CCCC\"}")
                            .with(r -> { r.setRemoteAddr("10.99.0.1"); return r; }))
                    .andReturn().getResponse().getStatus();
            if (statut == 429) {
                refus++;
            }
        }
        org.assertj.core.api.Assertions.assertThat(refus).isEqualTo(1);
    }
}
