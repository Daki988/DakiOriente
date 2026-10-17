package com.neamindustry.casier;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
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

/** Parcours de bout en bout (section 8) sur base réelle : demande, paiement, rapprochement, bulletin, vérification. */
class ParcoursDemandeIntegrationTest extends TestIntegration {

    @Autowired
    private ServiceDemandes demandes;

    private DemandeDeposee deposer(String usager, String nom, String prenoms, LocalDate naissance, String cnie) throws Exception {
        Map<String, Object> identite = new java.util.HashMap<>(Map.of("nom", nom, "prenoms", prenoms, "dateNaissance", naissance.toString(),
                "lieuNaissance", "Libreville"));
        if (cnie != null) {
            identite.put("numeroCnie", cnie);
        }
        String reponse = mvc.perform(post("/api/v1/demandes").with(usager(usager)).contentType(MediaType.APPLICATION_JSON)
                        .content(enJson(Map.of("profil", "GABONAIS_NE_AU_GABON", "identite", identite, "telephone", "+241 77 00 00 00"))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        return lire(reponse, DemandeDeposee.class);
    }

    @Test
    @DisplayName("RG-01, RG-10, PAY-07 : identité vérifiée et absente du casier → bulletin n°3 néant émis sans intervention humaine")
    void absenceCertaineEmissionAutomatique() throws Exception {
        DemandeDeposee d = deposer("usager-absence", "NZIENGUI FICTIF", "Armel", LocalDate.of(1992, 2, 3), null);
        assertThat(d.montantFcfa()).isEqualTo(1500);
        assertThat(d.tarifProvisoire()).isTrue();
        assertThat(d.numeroDossier()).matches("CJ-\\d{4}-\\d{6}");

        mvc.perform(post("/api/public/v1/simulateur-paiement").contentType(MediaType.APPLICATION_JSON)
                        .content(enJson(Map.of("numeroDossier", d.numeroDossier(), "montantFcfa", 1500))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statut").value("DELIVREE"))
                .andExpect(jsonPath("$.numeroBulletin").value(org.hamcrest.Matchers.startsWith("B3-")))
                // ADR 0004 : ni jeton ni code de vérification dans la réponse.
                .andExpect(jsonPath("$.jeton").doesNotExist());

        mvc.perform(get("/api/public/v1/suivi").param("numero", d.numeroDossier()).param("code", d.codeSuivi()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statut").value("DELIVREE"))
                .andExpect(jsonPath("$.frise.length()").value(3));

        mvc.perform(get("/api/public/v1/suivi").param("numero", d.numeroDossier()).param("code", "000000"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("BUL-06, BUL-07, BUL-10, ARC-01 : le bulletin émis est vérifiable par jeton et par code, puis affiché révoqué")
    void verificationPuisRevocation() throws Exception {
        DemandeDeposee d = deposer("usager-verif", "MOUELE FICTIF", "Grâce", LocalDate.of(1990, 7, 21), null);
        ResultatTraitement r = demandes.confirmerPaiement(d.numeroDossier(), "TEST-" + UUID.randomUUID(), 1500, Instant.now());
        assertThat(r.statut()).isEqualTo(StatutDemande.DELIVREE);
        String jeton = r.bulletin().jeton();
        assertThat(jeton).hasSizeGreaterThanOrEqualTo(43);

        // Copie de vérification alimentée par événement, après validation de la transaction (ARC-01).
        await().atMost(Duration.ofSeconds(10)).untilAsserted(() ->
                mvc.perform(get("/api/public/v1/verifications/jeton/{j}", jeton))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.statut").value("VALIDE"))
                        .andExpect(jsonPath("$.nom").value("MOUELE FICTIF"))
                        .andExpect(jsonPath("$.condamnations").doesNotExist()));

        mvc.perform(post("/api/public/v1/verifications/code").contentType(MediaType.APPLICATION_JSON)
                        .content(enJson(Map.of("code", r.bulletin().codeCourt().toLowerCase()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authentique").value(true));

        // BUL-01, DSH-01 : PDF scellé, téléchargeable par le seul demandeur.
        byte[] pdf = mvc.perform(get("/api/v1/bulletins/{id}/pdf", r.bulletin().id()).with(usager("usager-verif")))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().contentType(MediaType.APPLICATION_PDF))
                .andReturn().getResponse().getContentAsByteArray();
        assertThat(new String(pdf, 0, 5, StandardCharsets.ISO_8859_1)).isEqualTo("%PDF-");
        java.nio.file.Files.createDirectories(java.nio.file.Path.of("target"));
        java.nio.file.Files.write(java.nio.file.Path.of("target/bulletin-exemple.pdf"), pdf);
        mvc.perform(get("/api/v1/bulletins/{id}/pdf", r.bulletin().id()).with(usager("autre-usager")))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/bulletins/recus").with(usager("usager-verif")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].numero").value(r.bulletin().numero()))
                .andExpect(jsonPath("$[0].jeton").doesNotExist());

        // BUL-08 : contrôle d'un PDF déposé, intact puis falsifié d'un seul octet.
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart("/api/public/v1/verifications/document")
                        .file(new org.springframework.mock.web.MockMultipartFile("fichier", "b.pdf", "application/pdf", pdf)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.integre").value(true))
                .andExpect(jsonPath("$.resultat.statut").value("VALIDE"));
        byte[] falsifie = pdf.clone();
        int i = new String(falsifie, StandardCharsets.ISO_8859_1).indexOf("/Producer");
        falsifie[i + 2] = (byte) (falsifie[i + 2] == 'r' ? 'R' : 'r');
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart("/api/public/v1/verifications/document")
                        .file(new org.springframework.mock.web.MockMultipartFile("fichier", "b.pdf", "application/pdf", falsifie)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.integre").value(false));

        mvc.perform(post("/api/v1/bulletins/{id}/revocation", r.bulletin().id()).with(greffier("greffier-1"))
                        .contentType(MediaType.APPLICATION_JSON).content(enJson(Map.of("motif", ""))))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/bulletins/{id}/revocation", r.bulletin().id()).with(agent("agent-x"))
                        .contentType(MediaType.APPLICATION_JSON).content(enJson(Map.of("motif", "Émis par erreur"))))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/bulletins/{id}/revocation", r.bulletin().id()).with(greffier("greffier-1"))
                        .contentType(MediaType.APPLICATION_JSON).content(enJson(Map.of("motif", "Émis par erreur"))))
                .andExpect(status().isNoContent());

        await().atMost(Duration.ofSeconds(10)).untilAsserted(() ->
                mvc.perform(get("/api/public/v1/verifications/jeton/{j}", jeton))
                        .andExpect(jsonPath("$.statut").value("REVOQUE")));

        mvc.perform(get("/api/public/v1/verifications/jeton/{j}", "jeton-inconnu-" + UUID.randomUUID()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statut").value("INCONNU"))
                .andExpect(jsonPath("$.authentique").value(false));
    }

    @Test
    @DisplayName("REG-03, HAB-02, RG-04, IDT-03 : condamnation validée à quatre yeux puis reprise sur le bulletin de la même personne")
    void condamnationValideeRepriseAuBulletin() throws Exception {
        IdentitePersonne personne = new IdentitePersonne("OBIANG FICTIF", "Paul Serge", LocalDate.of(1985, 4, 12), "Libreville", "Gabon",
                "OBIANG Pierre", "NDONG Marie", List.of("Gabonaise"), "CNIEDEMO0001", null, List.of());
        SaisieCondamnation saisie = new SaisieCondamnation(null, personne, JURIDICTION, LocalDate.of(2023, 1, 10), "JUG-2023-0042",
                "Vol (fictif)", Qualification.DELIT, List.of(new Peine(NaturePeine.EMPRISONNEMENT, 6, null, Sursis.AUCUN, null)),
                LocalDate.of(2023, 3, 1), "PIECE-FICTIVE-1");
        String reponse = mvc.perform(post("/api/v1/registre/condamnations").with(agent("agent-1"))
                        .contentType(MediaType.APPLICATION_JSON).content(enJson(saisie)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        UUID condamnation = UUID.fromString(json.readTree(reponse).get("id").asString());

        // HAB-02 : l'auteur ne valide pas sa propre saisie ; HAB-01 : hors juridiction refusé.
        mvc.perform(post("/api/v1/registre/condamnations/{id}/validation", condamnation).with(acteur("agent-1", JURIDICTION, false, "R06", "R07")))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/registre/condamnations/{id}/validation", condamnation).with(acteur("greffier-2", "TPI-PORT-GENTIL", false, "R07")))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/registre/condamnations/{id}/validation", condamnation).with(greffier("greffier-1")))
                .andExpect(status().isNoContent());

        DemandeDeposee d = deposer("usager-obiang", "OBIANG FICTIF", "Paul Serge", LocalDate.of(1985, 4, 12), "CNIEDEMO0001");
        ResultatTraitement r = demandes.confirmerPaiement(d.numeroDossier(), "TEST-" + UUID.randomUUID(), 1500, Instant.now());
        assertThat(r.statut()).isEqualTo(StatutDemande.DELIVREE);
        assertThat(r.bulletin().contenu().neant()).isFalse();
        assertThat(r.bulletin().contenu().condamnations()).hasSize(1);
    }

    @Test
    @DisplayName("RG-06, IDT-06, DSH-05 : un homonyme part en file de travail ; l'agent tranche, motivation obligatoire")
    void homonymeTraiteParUnAgent() throws Exception {
        IdentitePersonne inscrit = new IdentitePersonne("ESSONO FICTIF", "Jean", LocalDate.of(1979, 9, 9), "Oyem", "Gabon",
                null, null, List.of("Gabonaise"), null, null, List.of());
        SaisieCondamnation saisie = new SaisieCondamnation(null, inscrit, JURIDICTION, LocalDate.of(2020, 5, 5), "JUG-2020-0007",
                "Escroquerie (fictif)", Qualification.DELIT, List.of(new Peine(NaturePeine.EMPRISONNEMENT, 12, null, Sursis.AUCUN, null)),
                LocalDate.of(2020, 7, 1), "PIECE-FICTIVE-2");
        String reponse = mvc.perform(post("/api/v1/registre/condamnations").with(agent("agent-2"))
                .contentType(MediaType.APPLICATION_JSON).content(enJson(saisie))).andReturn().getResponse().getContentAsString();
        mvc.perform(post("/api/v1/registre/condamnations/{id}/validation", json.readTree(reponse).get("id").asString())
                .with(greffier("greffier-1"))).andExpect(status().isNoContent());

        // Même nom, même prénom, autre date de naissance : jamais tranché automatiquement (RG-06).
        DemandeDeposee d = deposer("usager-essono", "ESSONO FICTIF", "Jean", LocalDate.of(1981, 1, 15), null);
        ResultatTraitement r = demandes.confirmerPaiement(d.numeroDossier(), "TEST-" + UUID.randomUUID(), 1500, Instant.now());
        assertThat(r.statut()).isEqualTo(StatutDemande.A_TRAITER_PAR_AGENT);

        String file = mvc.perform(get("/api/v1/demandes/file").with(agent("agent-3")))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        String id = null;
        for (var n : json.readTree(file)) {
            if (n.get("numeroDossier").asString().equals(d.numeroDossier())) {
                id = n.get("id").asString();
            }
        }
        assertThat(id).as("dossier présent dans la file de travail").isNotNull();

        mvc.perform(post("/api/v1/demandes/{id}/decision-identite", id).with(agent("agent-3")).contentType(MediaType.APPLICATION_JSON)
                .content("{\"personneId\":null,\"motivation\":\"\"}")).andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/demandes/{id}/decision-identite", id).with(agent("agent-3")).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"personneId\":null,\"motivation\":\"Date et lieu de naissance différents, filiation distincte (acte vérifié).\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statut").value("DELIVREE"));
    }

    @Test
    @DisplayName("PAY-02, PAY-04 : notification signée seulement ; une transaction n'est traitée qu'une fois ; montant contrôlé")
    void notificationsDePaiement() throws Exception {
        DemandeDeposee d = deposer("usager-paiement", "MAGANGA FICTIF", "Rose", LocalDate.of(1995, 12, 1), null);
        String reference = "AGR-" + UUID.randomUUID();
        byte[] corps = enJson(Map.of("numeroDossier", d.numeroDossier(), "reference", reference, "montantFcfa", 1500,
                "payeLe", Instant.now().toString())).getBytes(StandardCharsets.UTF_8);

        mvc.perform(post("/api/operateurs/v1/paiements/notifications").contentType(MediaType.APPLICATION_JSON).content(corps))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/operateurs/v1/paiements/notifications").contentType(MediaType.APPLICATION_JSON).content(corps)
                        .header("X-Signature-Casier", signer("autre-secret", corps)))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/operateurs/v1/paiements/notifications").contentType(MediaType.APPLICATION_JSON).content(corps)
                        .header("X-Signature-Casier", signer(SECRET_PAIEMENT, corps)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statut").value("DELIVREE"));
        // Rejeu de la même notification : sans effet, même réponse.
        mvc.perform(post("/api/operateurs/v1/paiements/notifications").contentType(MediaType.APPLICATION_JSON).content(corps)
                        .header("X-Signature-Casier", signer(SECRET_PAIEMENT, corps)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statut").value("DELIVREE"));

        DemandeDeposee autre = deposer("usager-montant", "MAGANGA FICTIF", "Lys", LocalDate.of(1996, 1, 2), null);
        byte[] faux = enJson(Map.of("numeroDossier", autre.numeroDossier(), "reference", "AGR-" + UUID.randomUUID(), "montantFcfa", 100,
                "payeLe", Instant.now().toString())).getBytes(StandardCharsets.UTF_8);
        mvc.perform(post("/api/operateurs/v1/paiements/notifications").contentType(MediaType.APPLICATION_JSON).content(faux)
                        .header("X-Signature-Casier", signer(SECRET_PAIEMENT, faux)))
                .andExpect(status().isUnprocessableContent());
    }

    @Test
    @DisplayName("RG-01 : seul un usager (R01) dépose une demande ; sans jeton, accès refusé")
    void depotReserveAuxUsagers() throws Exception {
        String corps = enJson(Map.of("profil", "GABONAIS_NE_AU_GABON", "identite", Map.of("nom", "X", "prenoms", "Y",
                "dateNaissance", "1990-01-01", "lieuNaissance", "Libreville")));
        mvc.perform(post("/api/v1/demandes").contentType(MediaType.APPLICATION_JSON).content(corps)).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/demandes").with(agent("agent-1")).contentType(MediaType.APPLICATION_JSON).content(corps))
                .andExpect(status().isForbidden());
        // ADR 0005 : pas de tarif fixé pour ce profil → demande refusée avec un message clair.
        mvc.perform(post("/api/v1/demandes").with(usager("usager-etranger")).contentType(MediaType.APPLICATION_JSON)
                        .content(corps.replace("GABONAIS_NE_AU_GABON", "ETRANGER_RESIDENT")))
                .andExpect(status().isUnprocessableContent());
    }

    private static String signer(String secret, byte[] corps) throws Exception {
        javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
        mac.init(new javax.crypto.spec.SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return java.util.HexFormat.of().formatHex(mac.doFinal(corps));
    }
}
