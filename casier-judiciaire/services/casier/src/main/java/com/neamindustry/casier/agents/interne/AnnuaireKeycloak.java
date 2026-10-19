package com.neamindustry.casier.agents.interne;

import java.net.URI;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.TreeSet;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.neamindustry.casier.agents.AnnuaireAgents;
import com.neamindustry.casier.agents.AnnuaireIndisponible;
import com.neamindustry.casier.agents.CompteAgent;
import com.neamindustry.casier.agents.NouvelAgent;
import com.neamindustry.casier.agents.ParametresAgents;
import com.neamindustry.casier.commun.ErreurMetier;

/** Annuaire adossé à l'interface d'administration de Keycloak (client technique, jeton de courte durée). */
class AnnuaireKeycloak implements AnnuaireAgents {

    private static final ParameterizedTypeReference<List<Map<String, Object>>> LISTE = new ParameterizedTypeReference<>() {
    };
    private static final ParameterizedTypeReference<Map<String, Object>> OBJET = new ParameterizedTypeReference<>() {
    };

    private final ParametresAgents parametres;
    private final RestClient http;

    AnnuaireKeycloak(ParametresAgents parametres) {
        this.parametres = parametres;
        this.http = RestClient.builder().baseUrl(parametres.adresse()).build();
    }

    @Override
    public List<CompteAgent> comptes(Set<String> roles) {
        return appel(() -> {
            String jeton = jeton();
            Map<String, CompteAgent> comptes = new LinkedHashMap<>();
            for (String role : new TreeSet<>(roles)) {
                List<Map<String, Object>> utilisateurs = http.get()
                        .uri("/admin/realms/{r}/roles/{role}/users?first=0&max=1000&briefRepresentation=false", parametres.royaume(), role)
                        .header("Authorization", "Bearer " + jeton).retrieve().body(LISTE);
                for (Map<String, Object> u : utilisateurs == null ? List.<Map<String, Object>>of() : utilisateurs) {
                    comptes.putIfAbsent(String.valueOf(u.get("id")), compte(u, role));
                }
            }
            return new ArrayList<>(comptes.values());
        });
    }

    @Override
    public Optional<CompteAgent> compte(String identifiant) {
        return appel(() -> {
            String jeton = jeton();
            Map<String, Object> u;
            try {
                u = http.get().uri("/admin/realms/{r}/users/{id}", parametres.royaume(), identifiant)
                        .header("Authorization", "Bearer " + jeton).retrieve().body(OBJET);
            } catch (HttpClientErrorException.NotFound e) {
                return Optional.<CompteAgent>empty();
            }
            List<Map<String, Object>> roles = http.get().uri("/admin/realms/{r}/users/{id}/role-mappings/realm", parametres.royaume(), identifiant)
                    .header("Authorization", "Bearer " + jeton).retrieve().body(LISTE);
            Set<String> noms = new TreeSet<>();
            for (Map<String, Object> r : roles == null ? List.<Map<String, Object>>of() : roles) {
                String nom = String.valueOf(r.get("name"));
                if (nom.matches("R\\d{2}")) {
                    noms.add(nom);
                }
            }
            String role = noms.contains("R13") ? "R13" : noms.stream().filter(n -> !n.equals("R01")).findFirst().orElse(null);
            return Optional.of(compte(u, role));
        });
    }

    @Override
    public CompteAgent creer(NouvelAgent a, String motDePasseProvisoire) {
        return appel(() -> {
            String jeton = jeton();
            Map<String, Object> rep = new HashMap<>();
            rep.put("username", a.login());
            rep.put("firstName", a.prenom());
            rep.put("lastName", a.nom());
            rep.put("email", a.email());
            rep.put("enabled", true);
            rep.put("requiredActions", List.of("UPDATE_PASSWORD", "CONFIGURE_TOTP"));
            rep.put("credentials", List.of(Map.of("type", "password", "value", motDePasseProvisoire, "temporary", true)));
            if (a.juridiction() != null) {
                rep.put("attributes", Map.of("juridiction", List.of(a.juridiction())));
            }
            URI emplacement;
            try {
                emplacement = http.post().uri("/admin/realms/{r}/users", parametres.royaume()).header("Authorization", "Bearer " + jeton)
                        .contentType(MediaType.APPLICATION_JSON).body(rep).retrieve().toBodilessEntity().getHeaders().getLocation();
            } catch (HttpClientErrorException.Conflict e) {
                throw new ErreurMetier(ErreurMetier.Nature.CONFLIT, "AGT-01", "Cet identifiant ou cette adresse électronique est déjà utilisé.");
            }
            if (emplacement == null) {
                throw new AnnuaireIndisponible("Le fournisseur d'identité n'a pas renvoyé l'identifiant du compte créé.");
            }
            String chemin = emplacement.getPath();
            String id = chemin.substring(chemin.lastIndexOf('/') + 1);
            affecter(jeton, id, a.role(), HttpMethod.POST);
            return compte(id).orElseThrow();
        });
    }

    @Override
    public void changerRole(String identifiant, String ancienRole, String nouveauRole) {
        appel(() -> {
            String jeton = jeton();
            if (ancienRole != null) {
                affecter(jeton, identifiant, ancienRole, HttpMethod.DELETE);
            }
            affecter(jeton, identifiant, nouveauRole, HttpMethod.POST);
            return null;
        });
    }

    @Override
    public void changerJuridiction(String identifiant, String juridiction) {
        appel(() -> {
            String jeton = jeton();
            Map<String, Object> u = http.get().uri("/admin/realms/{r}/users/{id}", parametres.royaume(), identifiant)
                    .header("Authorization", "Bearer " + jeton).retrieve().body(OBJET);
            @SuppressWarnings("unchecked")
            Map<String, Object> attributs = new HashMap<>(u.get("attributes") instanceof Map<?, ?> m ? (Map<String, Object>) m : Map.of());
            if (juridiction == null) {
                attributs.remove("juridiction");
            } else {
                attributs.put("juridiction", List.of(juridiction));
            }
            u.put("attributes", attributs);
            http.put().uri("/admin/realms/{r}/users/{id}", parametres.royaume(), identifiant).header("Authorization", "Bearer " + jeton)
                    .contentType(MediaType.APPLICATION_JSON).body(u).retrieve().toBodilessEntity();
            return null;
        });
    }

    @Override
    public void activer(String identifiant, boolean actif) {
        appel(() -> {
            String jeton = jeton();
            http.put().uri("/admin/realms/{r}/users/{id}", parametres.royaume(), identifiant).header("Authorization", "Bearer " + jeton)
                    .contentType(MediaType.APPLICATION_JSON).body(Map.of("enabled", actif)).retrieve().toBodilessEntity();
            return null;
        });
    }

    private void affecter(String jeton, String id, String role, HttpMethod methode) {
        Map<String, Object> representation = http.get().uri("/admin/realms/{r}/roles/{role}", parametres.royaume(), role)
                .header("Authorization", "Bearer " + jeton).retrieve().body(OBJET);
        http.method(methode).uri("/admin/realms/{r}/users/{id}/role-mappings/realm", parametres.royaume(), id)
                .header("Authorization", "Bearer " + jeton).contentType(MediaType.APPLICATION_JSON)
                .body(List.of(representation)).retrieve().toBodilessEntity();
    }

    private String jeton() {
        LinkedMultiValueMap<String, String> formulaire = new LinkedMultiValueMap<>();
        formulaire.add("grant_type", "client_credentials");
        formulaire.add("client_id", parametres.client());
        formulaire.add("client_secret", parametres.secret());
        Map<String, Object> reponse = http.post().uri("/realms/{r}/protocol/openid-connect/token", parametres.royaume())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED).body(formulaire).retrieve().body(OBJET);
        Object jeton = reponse == null ? null : reponse.get("access_token");
        if (jeton == null) {
            throw new AnnuaireIndisponible("Le fournisseur d'identité a refusé l'accès d'administration.");
        }
        return jeton.toString();
    }

    @SuppressWarnings("unchecked")
    private static CompteAgent compte(Map<String, Object> u, String role) {
        String juridiction = null;
        if (u.get("attributes") instanceof Map<?, ?> attributs && attributs.get("juridiction") instanceof List<?> valeurs && !valeurs.isEmpty()) {
            juridiction = String.valueOf(valeurs.getFirst());
        }
        Object cree = u.get("createdTimestamp");
        return new CompteAgent(String.valueOf(u.get("id")), texte(u.get("username")), texte(u.get("firstName")), texte(u.get("lastName")),
                texte(u.get("email")), role, juridiction, Boolean.TRUE.equals(u.get("enabled")),
                cree instanceof Number n ? Instant.ofEpochMilli(n.longValue()) : null);
    }

    private static String texte(Object o) {
        return o == null ? "" : o.toString();
    }

    private <T> T appel(java.util.function.Supplier<T> action) {
        try {
            return action.get();
        } catch (ErreurMetier | AnnuaireIndisponible e) {
            throw e;
        } catch (HttpClientErrorException e) {
            if (e.getStatusCode() == HttpStatus.FORBIDDEN || e.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                throw new AnnuaireIndisponible("Le client technique n'a pas les droits de gestion des utilisateurs.");
            }
            throw new AnnuaireIndisponible("Le fournisseur d'identité a refusé l'opération.");
        } catch (RestClientException e) {
            throw new AnnuaireIndisponible("Le fournisseur d'identité ne répond pas.");
        }
    }
}
