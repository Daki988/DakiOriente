package com.neamindustry.casier.habilitations;

import java.util.Collection;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

/**
 * Construit l'{@link Acteur} à partir du jeton OpenID Connect émis par Keycloak (section 18).
 * Rôles lus dans {@code realm_access.roles} (codes R01 à R14) ; juridiction, organisme et
 * identité vérifiée lus dans des attributs dédiés du jeton.
 */
@Component
public class ActeurCourant {

    public Acteur obtenir() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (!(auth instanceof JwtAuthenticationToken jwtAuth)) {
            throw new AccesRefuse("AUTH", "Authentification requise.");
        }
        return depuisJeton(jwtAuth.getToken());
    }

    static Acteur depuisJeton(Jwt jwt) {
        return new Acteur(
                jwt.getSubject(),
                jwt.getClaimAsString("name"),
                roles(jwt),
                jwt.getClaimAsString("juridiction"),
                jwt.getClaimAsString("organisme"),
                Boolean.TRUE.equals(jwt.getClaimAsBoolean("identite_verifiee")));
    }

    static Set<Role> roles(Jwt jwt) {
        Set<Role> roles = EnumSet.noneOf(Role.class);
        Object realm = jwt.getClaim("realm_access");
        Collection<?> valeurs = realm instanceof Map<?, ?> m && m.get("roles") instanceof Collection<?> c ? c : List.of();
        for (Object v : valeurs) {
            for (Role r : Role.values()) {
                if (r.name().equals(String.valueOf(v))) {
                    roles.add(r);
                }
            }
        }
        return roles;
    }
}
