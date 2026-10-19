package com.neamindustry.casier;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;

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

/** Réclamations, tableau du comptable, dépôt de pièces, listes du registre et recherche d'un bulletin à révoquer. */
class FonctionsCompletementairesIntegrationTest extends TestIntegration {

    @Autowired
    private ServiceDemandes demandes;

    private static final String AUJOURDHUI = LocalDate.now(ZoneId.of("Africa/Libreville")).toString();

    private DemandeDeposee deposer(String usager, String nom, LocalDate naissance) throws Exception {
        String r = mvc.perform(post("/api/v1/demandes").with(usager(usager)).contentType(MediaType.APPLICATION_JSON)
                        .content(enJson(Map.of("profil", "GABONAIS_NE_AU_GABON",
                                "identite", Map.of("nom", nom, "prenoms", "Paul", "dateNaissance", naissance.toString(), "lieuNaissance", "Oyem")))))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        return lire(r, DemandeDeposee.class);
    }

    private String payerTresor(DemandeDeposee d, String quittance) throws Exception {
        return mvc.perform(post("/api/public/v1/paiements/tresor").contentType(MediaType.APPLICATION_JSON)
                        .content(enJson(Map.of("numeroDossier", d.numeroDossier(), "code", d.codeSuivi(), "quittance", quittance))))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
    }

    private static org.springframework.test.web.servlet.request.RequestPostProcessor role(String sujet, String role) {
        return acteur(sujet, JURIDICTION, false, role);
    }

    @Test
    @DisplayName("Réclamation : déposée par l'usager, prise en charge et traitée par le support, réponse visible par l'usager")
    void reclamation() throws Exception {
        mvc.perform(post("/api/v1/usager/reclamations").with(usager("usager-rec")).contentType(MediaType.APPLICATION_JSON)
                .content(enJson(Map.of("categorie", "PAIEMENT", "message", "court")))).andExpect(status().is(422));
        String r = mvc.perform(post("/api/v1/usager/reclamations").with(usager("usager-rec")).contentType(MediaType.APPLICATION_JSON)
                        .content(enJson(Map.of("categorie", "PAIEMENT", "numeroDossier", "cj-2026-000001",
                                "message", "J'ai payé par mobile money mais mon dossier est toujours en attente."))))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.statut").value("OUVERTE"))
                .andExpect(jsonPath("$.numeroDossier").value("CJ-2026-000001"))
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        String id = json.readTree(r).get("id").asString();

        mvc.perform(get("/api/v1/reclamations").with(agent("agent-rec"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/reclamations").with(role("support-1", "R11")))
                .andExpect(status().isOk()).andExpect(jsonPath("$[?(@.id == '" + id + "')].statut").value(org.hamcrest.Matchers.contains("OUVERTE")));
        mvc.perform(post("/api/v1/reclamations/{id}/prise-en-charge", id).with(role("support-1", "R11"))).andExpect(status().isNoContent());
        mvc.perform(post("/api/v1/reclamations/{id}/prise-en-charge", id).with(role("support-2", "R11"))).andExpect(status().isConflict());
        mvc.perform(post("/api/v1/reclamations/{id}/reponse", id).with(role("support-1", "R11")).contentType(MediaType.APPLICATION_JSON)
                .content(enJson(Map.of("reponse", "Votre paiement a été retrouvé ; le bulletin est disponible dans votre espace.")))).andExpect(status().isNoContent());
        mvc.perform(post("/api/v1/reclamations/{id}/reponse", id).with(role("support-1", "R11")).contentType(MediaType.APPLICATION_JSON)
                .content(enJson(Map.of("reponse", "Deuxième réponse inutile.")))).andExpect(status().isConflict());

        mvc.perform(get("/api/v1/usager/reclamations").with(usager("usager-rec")))
                .andExpect(jsonPath("$[0].statut").value("TRAITEE"))
                .andExpect(jsonPath("$[0].reponse").value(org.hamcrest.Matchers.startsWith("Votre paiement")));
        mvc.perform(get("/api/v1/usager/reclamations").with(usager("autre-usager-rec"))).andExpect(jsonPath("$.length()").value(0));
        assertThat(jdbc.sql("select count(*) from audit.journal where action like 'RECLAMATION_%' and objet_id = :id").param("id", id)
                .query(Long.class).single()).isEqualTo(3);
    }

    @Test
    @DisplayName("Comptable : paiements du jour, synthèse par moyen, rapprochement avec un relevé, export ; accès réservé")
    void comptabilite() throws Exception {
        DemandeDeposee d = deposer("usager-compta", "NDONG COMPTA FICTIF", LocalDate.of(1990, 1, 1));
        payerTresor(d, "TP-2026-555001");

        mvc.perform(get("/api/v1/comptabilite/synthese").param("du", AUJOURDHUI).param("au", AUJOURDHUI).with(agent("agent-c")))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/comptabilite/paiements").param("du", AUJOURDHUI).param("au", AUJOURDHUI).with(role("comptable-1", "R10")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.reference == 'TRESOR-TP-2026-555001')].moyen").value(org.hamcrest.Matchers.contains("TRESOR")));
        mvc.perform(get("/api/v1/comptabilite/synthese").param("du", AUJOURDHUI).param("au", AUJOURDHUI).with(role("comptable-1", "R10")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalParMoyen.TRESOR").isNumber());
        mvc.perform(get("/api/v1/comptabilite/synthese").param("du", AUJOURDHUI).param("au", "2020-01-01").with(role("comptable-1", "R10")))
                .andExpect(status().is(422));

        String releve = "reference;montant\nTRESOR-TP-2026-555001;1500\nTRESOR-INCONNUE-1;2000\n";
        String r = mvc.perform(post("/api/v1/comptabilite/rapprochement").param("du", AUJOURDHUI).param("au", AUJOURDHUI)
                        .with(role("comptable-1", "R10")).contentType(MediaType.TEXT_PLAIN).content(releve))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        var rapprochement = json.readTree(r);
        assertThat(rapprochement.get("lignesReleve").asInt()).isEqualTo(2);
        assertThat(r).contains("\"reference\":\"TRESOR-INCONNUE-1\"").contains("ABSENT_DE_LA_PLATEFORME");
        mvc.perform(post("/api/v1/comptabilite/rapprochement").param("du", AUJOURDHUI).param("au", AUJOURDHUI)
                .with(role("comptable-1", "R10")).contentType(MediaType.TEXT_PLAIN).content("x\ny;abc")).andExpect(status().is(422));

        String csv = mvc.perform(get("/api/v1/comptabilite/export").param("du", AUJOURDHUI).param("au", AUJOURDHUI).with(role("comptable-1", "R10")))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        assertThat(csv).startsWith("numero_dossier;reference;moyen").contains(d.numeroDossier() + ";TRESOR-TP-2026-555001;TRESOR;");
    }

    @Test
    @DisplayName("Pièce : fichier déposé par le seul demandeur (type contrôlé sur le contenu), consulté par l'agent avec trace")
    void depotDePiece() throws Exception {
        IdentitePersonne inscrit = new IdentitePersonne("MOUSSAVOU PIECE FICTIF", "Jean", LocalDate.of(1970, 2, 2), "Lambaréné", "Gabon",
                null, null, List.of(), null, null, List.of());
        SaisieCondamnation s = new SaisieCondamnation(null, inscrit, JURIDICTION, LocalDate.of(2020, 3, 3), "JUG-FICHIER-1",
                "Infraction fictive", Qualification.DELIT, List.of(new Peine(NaturePeine.EMPRISONNEMENT, 3, null, Sursis.AUCUN, null)),
                LocalDate.of(2020, 5, 1), "PIECE-FICTIVE");
        String c = mvc.perform(post("/api/v1/registre/condamnations").with(agent("agent-saisie-f")).contentType(MediaType.APPLICATION_JSON)
                .content(enJson(s))).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        mvc.perform(post("/api/v1/registre/condamnations/{id}/validation", json.readTree(c).get("id").asString()).with(greffier("greffier-f")))
                .andExpect(status().isNoContent());
        DemandeDeposee d = deposer("usager-fichier", "MOUSSAVOU PIECE FICTIF", LocalDate.of(1972, 4, 4));
        ResultatTraitement t = demandes.confirmerPaiement(d.numeroDossier(), "TEST-" + UUID.randomUUID(), 1500, Instant.now());
        assertThat(t.statut()).isEqualTo(StatutDemande.A_TRAITER_PAR_AGENT);
        UUID id = jdbc.sql("select id from demandes.demande where numero_dossier = :n").param("n", d.numeroDossier()).query(UUID.class).single();

        MockMultipartFile pdf = new MockMultipartFile("fichier", "../../acte de naissance.pdf", "application/pdf",
                "%PDF-1.7\n% fictif\n".getBytes(StandardCharsets.US_ASCII));
        mvc.perform(multipart("/api/v1/demandes/{id}/pieces", id).file(pdf).with(usager("usager-fichier"))).andExpect(status().isConflict());
        mvc.perform(post("/api/v1/demandes/{id}/demande-piece", id).with(agent("agent-f")).contentType(MediaType.APPLICATION_JSON)
                .content(enJson(Map.of("piece", "Acte de naissance")))).andExpect(status().isNoContent());

        mvc.perform(multipart("/api/v1/demandes/{id}/pieces", id).file(pdf).with(usager("intrus"))).andExpect(status().isForbidden());
        MockMultipartFile faux = new MockMultipartFile("fichier", "photo.pdf", "application/pdf", "<html>pas un pdf</html>".getBytes());
        mvc.perform(multipart("/api/v1/demandes/{id}/pieces", id).file(faux).with(usager("usager-fichier"))).andExpect(status().is(422));
        String p = mvc.perform(multipart("/api/v1/demandes/{id}/pieces", id).file(pdf).with(usager("usager-fichier")))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.nomFichier").value("acte de naissance.pdf"))
                .andReturn().getResponse().getContentAsString();
        String pieceId = json.readTree(p).get("id").asString();
        mvc.perform(get("/api/public/v1/suivi").param("numero", d.numeroDossier()).param("code", d.codeSuivi()))
                .andExpect(jsonPath("$.statut").value("A_TRAITER_PAR_AGENT"));

        mvc.perform(get("/api/v1/demandes/{id}/pieces", id).with(usager("usager-fichier"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/demandes/{id}/pieces", id).with(agent("agent-f"))).andExpect(jsonPath("$.length()").value(1));
        byte[] contenu = mvc.perform(get("/api/v1/demandes/{id}/pieces/{p}", id, pieceId).with(agent("agent-f")))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsByteArray();
        assertThat(new String(contenu, 0, 5, StandardCharsets.US_ASCII)).isEqualTo("%PDF-");
        assertThat(jdbc.sql("select count(*) from audit.journal where action = 'PIECE_CONSULTEE' and objet_id = :id").param("id", id.toString())
                .query(Long.class).single()).isEqualTo(1);
    }

    @Test
    @DisplayName("Révocation : le greffier retrouve le bulletin par son numéro, le révoque ; listes des mentions et contestations")
    void revocationEtListes() throws Exception {
        DemandeDeposee d = deposer("usager-revoc", "OBAME REVOC FICTIF", LocalDate.of(1985, 5, 5));
        String numero = json.readTree(payerTresor(d, "TP-2026-555002")).get("numeroBulletin").asString();

        mvc.perform(get("/api/v1/bulletins/recherche").param("numero", numero).with(agent("agent-r"))).andExpect(status().isForbidden());
        String b = mvc.perform(get("/api/v1/bulletins/recherche").param("numero", numero.toLowerCase()).with(greffier("greffier-r")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.statut").value("EMIS")).andExpect(jsonPath("$.nom").value("OBAME REVOC FICTIF"))
                .andReturn().getResponse().getContentAsString();
        mvc.perform(post("/api/v1/bulletins/{id}/revocation", json.readTree(b).get("id").asString()).with(greffier("greffier-r"))
                .contentType(MediaType.APPLICATION_JSON).content(enJson(Map.of("motif", "Erreur d'identité constatée")))).andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/bulletins/recherche").param("numero", numero).with(greffier("greffier-r")))
                .andExpect(jsonPath("$.statut").value("REVOQUE")).andExpect(jsonPath("$.motifRevocation").value("Erreur d'identité constatée"));
        mvc.perform(get("/api/v1/bulletins/recherche").param("numero", "B3-0000-0000000").with(greffier("greffier-r"))).andExpect(status().isNotFound());

        mvc.perform(get("/api/v1/registre/mentions-en-attente").with(greffier("greffier-r"))).andExpect(status().isOk());
        mvc.perform(get("/api/v1/registre/mentions-en-attente").with(agent("agent-r"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/registre/contestations").with(agent("agent-r"))).andExpect(status().isOk());
        mvc.perform(get("/api/v1/registre/contestations").with(usager("usager-revoc"))).andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Gestion des agents : indisponible tant que l'accès d'administration n'est pas configuré ; réservée à l'administrateur")
    void agentsNonConfigure() throws Exception {
        mvc.perform(get("/api/v1/agents").with(agent("agent-a"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/agents").with(acteur("admin-a", null, false, "R13"))).andExpect(status().isServiceUnavailable());
    }
}
