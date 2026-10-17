package com.neamindustry.casier;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import com.neamindustry.casier.demandes.DemandeDeposee;

/** Paiement au Trésor par identifiant de paiement, puis validation et impression du bulletin au guichet. */
class TresorEtImpressionIntegrationTest extends TestIntegration {

    private DemandeDeposee deposer(String usager, String nom) throws Exception {
        String reponse = mvc.perform(post("/api/v1/demandes").with(usager(usager)).contentType(MediaType.APPLICATION_JSON)
                        .content(enJson(Map.of("profil", "GABONAIS_NE_AU_GABON", "telephone", "+241 77 00 00 01",
                                "identite", Map.of("nom", nom, "prenoms", "Lucie", "dateNaissance", "1994-05-06", "lieuNaissance", "Franceville")))))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        return lire(reponse, DemandeDeposee.class);
    }

    private String payer(String numero, String code, String quittance, int attendu) throws Exception {
        return mvc.perform(post("/api/public/v1/paiements/tresor").contentType(MediaType.APPLICATION_JSON)
                        .content(enJson(Map.of("numeroDossier", numero, "code", code, "quittance", quittance))))
                .andExpect(status().is(attendu)).andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
    }

    @Test
    @DisplayName("Trésor : la quittance et le code de suivi délivrent le bulletin ; une quittance ne paie qu'un dossier")
    void paiementAuTresor() throws Exception {
        DemandeDeposee d = deposer("usager-tresor", "MAKAYA FICTIF");
        payer(d.numeroDossier(), "000000", "TP-2026-000001", 404);
        payer(d.numeroDossier(), d.codeSuivi(), "x", 400);
        String r = payer(d.numeroDossier().toLowerCase(), d.codeSuivi(), "tp-2026-000001", 200);
        assertThat(r).contains("\"statut\":\"DELIVREE\"");
        // Même quittance, même dossier : réponse idempotente.
        assertThat(payer(d.numeroDossier(), d.codeSuivi(), "TP-2026-000001", 200)).contains("DELIVREE");

        DemandeDeposee autre = deposer("usager-tresor-2", "MAKAYA FICTIF BIS");
        payer(autre.numeroDossier(), autre.codeSuivi(), "TP-2026-000001", 409);
    }

    @Test
    @DisplayName("Impression : validation puis impression sur feuillet unique, réimpression motivée, accès réservé")
    void validationEtImpression() throws Exception {
        DemandeDeposee d = deposer("usager-impression", "TCHIBINDA FICTIF");
        assertThat(payer(d.numeroDossier(), d.codeSuivi(), "TP-2026-000777", 200)).contains("DELIVREE");
        String file = mvc.perform(get("/api/v1/impressions").with(greffier("validateur-1")))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        String id = null;
        for (var n : json.readTree(file)) {
            if (n.get("nom").asString().equals("TCHIBINDA FICTIF")) {
                id = n.get("id").asString();
            }
        }
        assertThat(id).isNotNull();
        String idFinal = id;
        assertThat(file).contains("A_VALIDER");

        mvc.perform(get("/api/v1/impressions").with(agent("agent-1"))).andExpect(status().isForbidden());
        Map<String, String> feuillet = Map.of("feuillet", "FS-000123");
        mvc.perform(post("/api/v1/impressions/{id}/impression", idFinal).with(greffier("validateur-1"))
                .contentType(MediaType.APPLICATION_JSON).content(enJson(feuillet))).andExpect(status().is(422));

        mvc.perform(post("/api/v1/impressions/{id}/validation", idFinal).with(greffier("validateur-1"))).andExpect(status().isNoContent());
        mvc.perform(post("/api/v1/impressions/{id}/validation", idFinal).with(greffier("validateur-1"))).andExpect(status().isConflict());

        byte[] pdf = mvc.perform(post("/api/v1/impressions/{id}/impression", idFinal).with(greffier("validateur-1"))
                        .contentType(MediaType.APPLICATION_JSON).content(enJson(feuillet)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsByteArray();
        assertThat(new String(pdf, 0, 5, StandardCharsets.ISO_8859_1)).isEqualTo("%PDF-");

        mvc.perform(post("/api/v1/impressions/{id}/impression", idFinal).with(greffier("validateur-1"))
                .contentType(MediaType.APPLICATION_JSON).content(enJson(feuillet))).andExpect(status().isConflict());
        mvc.perform(post("/api/v1/impressions/{id}/impression", idFinal).with(greffier("validateur-1"))
                .contentType(MediaType.APPLICATION_JSON).content(enJson(Map.of("feuillet", "FS-000124"))))
                .andExpect(status().is(422));
        mvc.perform(post("/api/v1/impressions/{id}/impression", idFinal).with(greffier("validateur-1"))
                        .contentType(MediaType.APPLICATION_JSON).content(enJson(Map.of("feuillet", "FS-000124", "motif", "Feuillet abîmé"))))
                .andExpect(status().isOk());

        mvc.perform(get("/api/v1/impressions").with(greffier("validateur-1")))
                .andExpect(jsonPath("$[?(@.id == '" + idFinal + "')].etat").value(org.hamcrest.Matchers.contains("IMPRIME")))
                .andExpect(jsonPath("$[?(@.id == '" + idFinal + "')].impressions").value(org.hamcrest.Matchers.contains(2)))
                .andExpect(jsonPath("$[?(@.id == '" + idFinal + "')].feuillet").value(org.hamcrest.Matchers.contains("FS-000124")));
    }

    @Test
    @DisplayName("Transparence : l'usager voit qui a traité ses données, sans nom d'agent ; avis de satisfaction anonyme")
    void accesEtSatisfaction() throws Exception {
        DemandeDeposee d = deposer("usager-transparence", "OKOUMA FICTIF");
        payer(d.numeroDossier(), d.codeSuivi(), "TP-2026-000999", 200);
        mvc.perform(get("/api/v1/usager/acces").with(usager("usager-transparence")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].action").value(org.hamcrest.Matchers.hasItems("DEMANDE_B3_DEPOSEE", "PAIEMENT_CONFIRME")))
                .andExpect(jsonPath("$[*].auteur").value(org.hamcrest.Matchers.hasItems("Vous", "Opérateur de paiement")))
                .andExpect(jsonPath("$[0].acteurId").doesNotExist());
        mvc.perform(get("/api/v1/usager/acces").with(usager("usager-sans-demande")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(get("/api/v1/usager/acces").with(agent("agent-x"))).andExpect(status().isForbidden());

        mvc.perform(post("/api/public/v1/avis-satisfaction").contentType(MediaType.APPLICATION_JSON)
                .content(enJson(Map.of("note", 5, "commentaire", "Rapide et clair", "parcours", "TRESOR")))).andExpect(status().isNoContent());
        mvc.perform(post("/api/public/v1/avis-satisfaction").contentType(MediaType.APPLICATION_JSON)
                .content(enJson(Map.of("note", 9, "parcours", "TRESOR")))).andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/pilotage/indicateurs").with(acteur("direction-1", null, false, "R08")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.demandes.satisfaction.nombreAvis").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)));
    }
}
