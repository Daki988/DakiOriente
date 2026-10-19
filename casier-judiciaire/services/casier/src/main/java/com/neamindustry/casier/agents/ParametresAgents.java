package com.neamindustry.casier.agents;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Accès à l'interface d'administration du fournisseur d'identité, par un client technique dédié
 * (« casier-gestion-agents ») limité à la gestion des utilisateurs. Le secret vient de l'environnement (SEC-05).
 *
 * @param adresse  adresse de Keycloak, par exemple http://keycloak:8080 ; vide : gestion des agents indisponible
 * @param royaume  royaume des comptes
 * @param client   client technique
 * @param secret   secret du client technique
 */
@ConfigurationProperties("casier.agents")
public record ParametresAgents(String adresse, String royaume, String client, String secret) {

    public ParametresAgents {
        adresse = adresse == null ? "" : adresse.replaceAll("/+$", "");
        royaume = royaume == null || royaume.isBlank() ? "casier" : royaume;
        client = client == null || client.isBlank() ? "casier-gestion-agents" : client;
    }

    public boolean configure() {
        return !adresse.isBlank() && secret != null && !secret.isBlank();
    }
}
