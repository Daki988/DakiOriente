package com.neamindustry.casier;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import com.neamindustry.casier.commun.NaturePeine;
import com.neamindustry.casier.commun.Peine;
import com.neamindustry.casier.commun.Qualification;
import com.neamindustry.casier.commun.Sursis;
import com.neamindustry.casier.demandes.DemandeDeposee;
import com.neamindustry.casier.demandes.ResultatTraitement;
import com.neamindustry.casier.demandes.ServiceDemandes;
import com.neamindustry.casier.demandes.StatutDemande;
import com.neamindustry.casier.registre.IdentitePersonne;
import com.neamindustry.casier.registre.SaisieCondamnation;

/** RG-07, RG-09, RG-13, DSH-05 : dossiers traités par un agent (pièce, contestation, rejet). */
class TraitementAgentIntegrationTest extends TestIntegration {

    @Autowired
    private ServiceDemandes demandes;

    private UUID inscrire(UUID personneId, IdentitePersonne identite, String decision) throws Exception {
        SaisieCondamnation s = new SaisieCondamnation(personneId, identite, JURIDICTION, LocalDate.of(2021, 3, 3), decision,
                "Infraction fictive", Qualification.DELIT, List.of(new Peine(NaturePeine.EMPRISONNEMENT, 3, null, Sursis.AUCUN, null)),
                LocalDate.of(2021, 5, 1), "PIECE-FICTIVE");
        String r = mvc.perform(post("/api/v1/registre/condamnations").with(agent("agent-saisie"))
                .contentType(MediaType.APPLICATION_JSON).content(enJson(s))).andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        UUID id = UUID.fromString(json.readTree(r).get("id").asString());
        mvc.perform(post("/api/v1/registre/condamnations/{id}/validation", id).with(greffier("greffier-valide")))
                .andExpect(status().isNoContent());
        return id;
    }

    private DemandeDeposee deposer(String usager, IdentitePersonne i, String cnie) throws Exception {
        Map<String, Object> identite = new HashMap<>(Map.of("nom", i.nom(), "prenoms", i.prenoms(),
                "dateNaissance", i.dateNaissance().toString(), "lieuNaissance", i.lieuNaissance()));
        if (cnie != null) {
            identite.put("numeroCnie", cnie);
        }
        String r = mvc.perform(post("/api/v1/demandes").with(usager(usager)).contentType(MediaType.APPLICATION_JSON)
                        .content(enJson(Map.of("profil", "GABONAIS_NE_AU_GABON", "identite", identite))))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return lire(r, DemandeDeposee.class);
    }

    private UUID idDossier(String numero) {
        return jdbc.sql("select id from demandes.demande where numero_dossier = :n").param("n", numero).query(UUID.class).single();
    }

    @Test
    @DisplayName("RG-09 : pièce demandée (délai suspendu), déposée par le seul demandeur, puis rejet motivé (RG-13)")
    void pieceDemandeeEtRejet() throws Exception {
        IdentitePersonne inscrit = new IdentitePersonne("BOUSSOUGOU FICTIF", "Marc", LocalDate.of(1975, 6, 6), "Mouila", "Gabon",
                null, null, List.of(), null, null, List.of());
        inscrire(null, inscrit, "JUG-PIECE-1");
        IdentitePersonne demandeur = new IdentitePersonne("BOUSSOUGOU FICTIF", "Marc", LocalDate.of(1977, 8, 8), "Mouila", "Gabon",
                null, null, List.of(), null, null, List.of());
        DemandeDeposee d = deposer("usager-piece", demandeur, null);
        ResultatTraitement r = demandes.confirmerPaiement(d.numeroDossier(), "TEST-" + UUID.randomUUID(), 1500, Instant.now());
        assertThat(r.statut()).isEqualTo(StatutDemande.A_TRAITER_PAR_AGENT);
        UUID id = idDossier(d.numeroDossier());

        mvc.perform(post("/api/v1/demandes/{id}/demande-piece", id).with(agent("agent-piece")).contentType(MediaType.APPLICATION_JSON)
                .content(enJson(Map.of("piece", "Copie intégrale de l'acte de naissance")))).andExpect(status().isNoContent());
        mvc.perform(get("/api/public/v1/suivi").param("numero", d.numeroDossier()).param("code", d.codeSuivi()))
                .andExpect(jsonPath("$.statut").value("EN_ATTENTE_PIECE"));
        mvc.perform(get("/api/v1/demandes/file").with(agent("agent-piece")))
                .andExpect(jsonPath("$[?(@.numeroDossier == '" + d.numeroDossier() + "')].statut").value(org.hamcrest.Matchers.contains("EN_ATTENTE_PIECE")));

        mvc.perform(post("/api/v1/demandes/{id}/piece", id).with(usager("autre-usager")).contentType(MediaType.APPLICATION_JSON)
                .content(enJson(Map.of("piece", "PIECE-1")))).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/demandes/{id}/piece", id).with(usager("usager-piece")).contentType(MediaType.APPLICATION_JSON)
                .content(enJson(Map.of("piece", "PIECE-1")))).andExpect(status().isNoContent());
        Instant echeance = jdbc.sql("select echeance from demandes.demande where id = :id").param("id", id).query(java.sql.Timestamp.class)
                .single().toInstant();
        assertThat(echeance).isAfter(Instant.now().plus(Duration.ofHours(23)));

        mvc.perform(post("/api/v1/demandes/{id}/rejet", id).with(agent("agent-piece")).contentType(MediaType.APPLICATION_JSON)
                .content(enJson(Map.of("motif", "")))).andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/demandes/{id}/rejet", id).with(agent("agent-piece")).contentType(MediaType.APPLICATION_JSON)
                .content(enJson(Map.of("motif", "Pièce illisible")))).andExpect(status().isNoContent());
        mvc.perform(post("/api/v1/demandes/{id}/rejet", id).with(agent("agent-piece")).contentType(MediaType.APPLICATION_JSON)
                .content(enJson(Map.of("motif", "Encore")))).andExpect(status().isConflict());
        mvc.perform(get("/api/public/v1/suivi").param("numero", d.numeroDossier()).param("code", d.codeSuivi()))
                .andExpect(jsonPath("$.statut").value("REJETEE"));
    }

    @Test
    @DisplayName("RG-07 : une contestation ouverte bloque l'émission ; une nouvelle inscription validée est signalée au dossier en cours")
    void contestationEtInscriptionPendantTraitement() throws Exception {
        IdentitePersonne p = new IdentitePersonne("MBOUMBA FICTIF", "Alice", LocalDate.of(1988, 10, 10), "Libreville", "Gabon",
                "MBOUMBA Jacques", "KOUMBA Rose", List.of("Gabonaise"), "CNIEDEMO0042", null, List.of());
        UUID condamnation = inscrire(null, p, "JUG-CONTEST-1");
        UUID personne = jdbc.sql("select personne_id from registre.condamnation where id = :id").param("id", condamnation)
                .query(UUID.class).single();

        String r = mvc.perform(post("/api/v1/registre/personnes/{p}/contestations", personne).with(agent("agent-contest"))
                .contentType(MediaType.APPLICATION_JSON).content(enJson(Map.of("motif", "Contestation de l'usager"))))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        UUID blocage = UUID.fromString(json.readTree(r).get("id").asString());

        DemandeDeposee d = deposer("usager-contest", p, "CNIEDEMO0042");
        ResultatTraitement t = demandes.confirmerPaiement(d.numeroDossier(), "TEST-" + UUID.randomUUID(), 1500, Instant.now());
        assertThat(t.statut()).isEqualTo(StatutDemande.A_TRAITER_PAR_AGENT);

        inscrire(personne, null, "JUG-CONTEST-2");
        UUID dossier = idDossier(d.numeroDossier());
        await().atMost(Duration.ofSeconds(10)).untilAsserted(() ->
                assertThat(jdbc.sql("select motif_agent from demandes.demande where id = :id").param("id", dossier).query(String.class).single())
                        .startsWith("RG-07"));

        mvc.perform(get("/api/v1/registre/personnes/{p}", personne).param("motif", d.numeroDossier()).with(agent("agent-contest")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.condamnations.length()").value(2))
                .andExpect(jsonPath("$.motifsBlocage[0]").value("Contestation en cours : Contestation de l'usager"));
        mvc.perform(get("/api/v1/registre/personnes/{p}", personne).param("motif", " ").with(agent("agent-contest")))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/registre/recherche").param("nom", "MBOUMBA FICTIF").param("prenoms", "Alice")
                        .param("motif", d.numeroDossier()).with(agent("agent-contest")))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].nom").value("MBOUMBA FICTIF"));

        mvc.perform(post("/api/v1/registre/personnes/{p}/contestations/{b}/cloture", personne, blocage).with(greffier("greffier-valide")))
                .andExpect(status().isNoContent());
        mvc.perform(post("/api/v1/registre/personnes/{p}/contestations/{b}/cloture", personne, blocage).with(greffier("greffier-valide")))
                .andExpect(status().isNotFound());
    }
}
