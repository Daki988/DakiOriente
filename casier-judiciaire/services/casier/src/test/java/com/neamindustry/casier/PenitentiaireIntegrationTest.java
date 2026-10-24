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
import org.springframework.test.web.servlet.request.RequestPostProcessor;

/** Gestion pénitentiaire : écrou, condamnation, mouvements autorisés par un tiers, transfert, libération, périmètre. */
class PenitentiaireIntegrationTest extends TestIntegration {

    private static RequestPostProcessor greffePen(String sujet, String etab) {
        return acteur(sujet, etab, false, "R16");
    }

    private static RequestPostProcessor chef(String sujet, String etab) {
        return acteur(sujet, etab, false, "R17");
    }

    private String json(Object o) {
        return enJson(o);
    }

    private String ecrouer(String nom, String titre, Integer duree) throws Exception {
        Map<String, Object> e = new HashMap<>(Map.of("nom", nom, "prenoms", "Paul", "dateNaissance", "1990-01-01", "lieuNaissance", "Libreville",
                "titreDetention", titre, "referenceTitre", "MD-2026-0101", "juridiction", "TPI de Libreville", "infraction", "Vol aggravé (fictif)",
                "dateEcrou", LocalDate.now().minusMonths(2).toString()));
        if (duree != null) {
            e.put("dureePeineMois", duree);
        }
        String r = mvc.perform(post("/api/v1/penitentiaire/detenus").with(greffePen("greffe-lbv", "LBV-PC-01")).contentType(MediaType.APPLICATION_JSON)
                .content(json(e))).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        return r;
    }

    @Test
    @DisplayName("Écrou, condamnation avec date de libération, transfert autorisé par le chef, libération ; aucun écrou sans titre")
    void parcoursPenitentiaire() throws Exception {
        mvc.perform(get("/api/public/v1/penitentiaire/etablissements")).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(6));
        mvc.perform(post("/api/v1/penitentiaire/detenus").with(greffePen("greffe-lbv", "LBV-PC-01")).contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("nom", "X", "prenoms", "Y", "dateNaissance", "1990-01-01", "lieuNaissance", "Oyem")))).andExpect(status().is(422));

        String r = ecrouer("NGUEMA PEN FICTIF", "MANDAT_DEPOT", null);
        var d = this.json.readTree(r);
        String id = d.get("id").asString();
        assertThat(d.get("statut").asString()).isEqualTo("PREVENU");
        assertThat(d.get("numeroEcrou").asString()).startsWith("LBV-");

        mvc.perform(get("/api/v1/penitentiaire/detenus/{id}", id).with(greffePen("greffe-pog", "POG-MA-01"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/penitentiaire/detenus").with(agent("agent-casier"))).andExpect(status().isForbidden());

        // Permission refusée à un prévenu ; condamnation : la détention provisoire s'impute.
        Map<String, Object> permission = Map.of("type", "PERMISSION", "destination", "Domicile familial, Libreville", "motif", "Obsèques",
                "prevuLe", Instant.now().plus(1, ChronoUnit.DAYS).toString());
        mvc.perform(post("/api/v1/penitentiaire/detenus/{id}/mouvements", id).with(greffePen("greffe-lbv", "LBV-PC-01"))
                .contentType(MediaType.APPLICATION_JSON).content(json(permission))).andExpect(status().is(422));
        mvc.perform(post("/api/v1/penitentiaire/detenus/{id}/condamnation", id).with(greffePen("greffe-lbv", "LBV-PC-01")).contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("titre", "JUGEMENT", "reference", "JUG-2026-0456", "juridiction", "TPI de Libreville", "dureePeineMois", 12))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.statut").value("CONDAMNE"))
                .andExpect(jsonPath("$.dateLiberationPrevue").value(LocalDate.now().minusMonths(2).plusMonths(12).toString()));

        // Transfert : demandé par le greffe, autorisé par le chef (jamais par le demandeur), puis effectué.
        Map<String, Object> transfert = Map.of("type", "TRANSFERT", "destination", "FCV-CP-01", "motif", "Rapprochement familial",
                "prevuLe", Instant.now().plus(2, ChronoUnit.HOURS).toString());
        String m = mvc.perform(post("/api/v1/penitentiaire/detenus/{id}/mouvements", id).with(greffePen("greffe-lbv", "LBV-PC-01"))
                        .contentType(MediaType.APPLICATION_JSON).content(json(transfert)))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.statut").value("DEMANDE")).andReturn().getResponse().getContentAsString();
        String mouvementId = this.json.readTree(m).get("id").asString();
        mvc.perform(post("/api/v1/penitentiaire/mouvements/{id}/execution", mouvementId).with(greffePen("greffe-lbv", "LBV-PC-01"))
                .contentType(MediaType.APPLICATION_JSON).content(json(Map.of("etape", "DEPART")))).andExpect(status().isConflict());
        mvc.perform(post("/api/v1/penitentiaire/mouvements/{id}/decision", mouvementId).with(chef("chef-pog", "POG-MA-01"))
                .contentType(MediaType.APPLICATION_JSON).content(json(Map.of("autoriser", true)))).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/penitentiaire/tableau-de-bord").with(chef("chef-lbv", "LBV-PC-01")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.mouvementsAAutoriser").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)));
        mvc.perform(post("/api/v1/penitentiaire/mouvements/{id}/decision", mouvementId).with(chef("chef-lbv", "LBV-PC-01"))
                .contentType(MediaType.APPLICATION_JSON).content(json(Map.of("autoriser", true)))).andExpect(status().isNoContent());
        mvc.perform(post("/api/v1/penitentiaire/mouvements/{id}/execution", mouvementId).with(greffePen("greffe-lbv", "LBV-PC-01"))
                .contentType(MediaType.APPLICATION_JSON).content(json(Map.of("etape", "DEPART")))).andExpect(status().isNoContent());

        // Le détenu relève désormais de Franceville.
        mvc.perform(get("/api/v1/penitentiaire/detenus/{id}", id).with(greffePen("greffe-lbv", "LBV-PC-01"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/penitentiaire/detenus/{id}", id).with(greffePen("greffe-fcv", "FCV-CP-01")))
                .andExpect(jsonPath("$.detenu.etablissement").value("FCV-CP-01")).andExpect(jsonPath("$.mouvements[0].statut").value("TERMINE"));

        // Libération par le chef de Franceville ; le greffe ne peut pas libérer.
        Map<String, Object> liberation = Map.of("motif", "LIBERTE_CONDITIONNELLE", "precision", "Ordonnance du JAP n° 12 (fictive)");
        mvc.perform(post("/api/v1/penitentiaire/detenus/{id}/liberation", id).with(greffePen("greffe-fcv", "FCV-CP-01"))
                .contentType(MediaType.APPLICATION_JSON).content(json(liberation))).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/penitentiaire/detenus/{id}/liberation", id).with(chef("chef-fcv", "FCV-CP-01"))
                .contentType(MediaType.APPLICATION_JSON).content(json(liberation))).andExpect(status().isOk()).andExpect(jsonPath("$.statut").value("LIBERE"));
        mvc.perform(post("/api/v1/penitentiaire/detenus/{id}/liberation", id).with(chef("chef-fcv", "FCV-CP-01"))
                .contentType(MediaType.APPLICATION_JSON).content(json(liberation))).andExpect(status().isConflict());

        // La direction voit tous les établissements.
        mvc.perform(get("/api/v1/penitentiaire/tableau-de-bord").with(acteur("dap-1", null, false, "R18")))
                .andExpect(jsonPath("$.etablissements.length()").value(6));
        mvc.perform(get("/api/v1/penitentiaire/detenus").param("recherche", "nguema pen").param("avecLiberes", "true").with(acteur("dap-1", null, false, "R18")))
                .andExpect(jsonPath("$[0].statut").value("LIBERE"));
        assertThat(jdbc.sql("select count(*) from audit.journal where objet_type = 'Detenu' and objet_id = :id and action in "
                        + "('MISE_SOUS_ECROU', 'CONDAMNATION_ENREGISTREE', 'MOUVEMENT_DEMANDE', 'MOUVEMENT_AUTORISE', 'MOUVEMENT_DEPART', 'TRANSFERT_EFFECTUE', 'LEVEE_ECROU')")
                .param("id", id).query(Long.class).single()).isEqualTo(7);
    }

    @Test
    @DisplayName("Le chef ne peut pas autoriser un mouvement qu'il a lui-même demandé (le greffe demande, le chef décide)")
    void quatreYeux() throws Exception {
        String r = ecrouer("BEKALE PEN FICTIF", "JUGEMENT", 6);
        String id = this.json.readTree(r).get("id").asString();
        Map<String, Object> extraction = Map.of("type", "EXTRACTION_MEDICALE", "destination", "CHU de Libreville", "motif", "Consultation",
                "prevuLe", Instant.now().plus(3, ChronoUnit.HOURS).toString(), "retourPrevu", Instant.now().plus(6, ChronoUnit.HOURS).toString());
        mvc.perform(post("/api/v1/penitentiaire/detenus/{id}/mouvements", id).with(chef("chef-lbv", "LBV-PC-01"))
                .contentType(MediaType.APPLICATION_JSON).content(json(extraction))).andExpect(status().isForbidden());
        String m = mvc.perform(post("/api/v1/penitentiaire/detenus/{id}/mouvements", id).with(acteur("greffe-chef", "LBV-PC-01", false, "R16", "R17"))
                .contentType(MediaType.APPLICATION_JSON).content(json(extraction))).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        mvc.perform(post("/api/v1/penitentiaire/mouvements/{id}/decision", this.json.readTree(m).get("id").asString())
                .with(acteur("greffe-chef", "LBV-PC-01", false, "R16", "R17")).contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("autoriser", true)))).andExpect(status().isForbidden());
    }
}
