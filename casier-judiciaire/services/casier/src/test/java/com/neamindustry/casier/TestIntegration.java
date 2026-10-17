package com.neamindustry.casier;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import tools.jackson.databind.json.JsonMapper;

/**
 * Socle des tests d'intégration : application complète, base réelle en conteneur, référentiels de démonstration chargés,
 * simulateur de paiement actif. Un seul contexte (et un seul conteneur) est partagé par toutes les classes.
 */
@SpringBootTest(properties = {
        "casier.referentiels.import-au-demarrage=true",
        "casier.paiement.simulateur=true",
        "casier.paiement.secret-notifications=" + TestIntegration.SECRET_PAIEMENT,
        "casier.public.limite-par-minute=1000"})
@AutoConfigureMockMvc
@Import(ConteneursTest.class)
public abstract class TestIntegration {

    protected static final String SECRET_PAIEMENT = "secret-de-test-uniquement";
    protected static final String JURIDICTION = "TPI-LIBREVILLE";

    @Autowired
    protected MockMvc mvc;

    @Autowired
    protected JdbcClient jdbc;

    @Autowired
    protected JsonMapper json;

    /** Jeton OpenID Connect simulé, au format de Keycloak (realm_access.roles, attributs dédiés). */
    protected static RequestPostProcessor acteur(String sujet, String juridiction, boolean identiteVerifiee, String... roles) {
        return jwt().jwt(j -> {
            Map<String, Object> claims = new HashMap<>();
            claims.put("realm_access", Map.of("roles", List.of(roles)));
            claims.put("name", sujet);
            claims.put("identite_verifiee", identiteVerifiee);
            if (juridiction != null) {
                claims.put("juridiction", juridiction);
            }
            j.subject(sujet).claims(c -> c.putAll(claims));
        });
    }

    protected static RequestPostProcessor usager(String sujet) {
        return acteur(sujet, null, true, "R01");
    }

    protected static RequestPostProcessor agent(String sujet) {
        return acteur(sujet, JURIDICTION, false, "R06");
    }

    protected static RequestPostProcessor greffier(String sujet) {
        return acteur(sujet, JURIDICTION, false, "R07");
    }

    protected static RequestPostProcessor auditeur() {
        return acteur("auditeur-1", null, false, "R12");
    }

    protected String enJson(Object o) {
        return json.writeValueAsString(o);
    }

    protected <T> T lire(String contenu, Class<T> type) {
        return json.readValue(contenu, type);
    }
}
