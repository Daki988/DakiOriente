package com.neamindustry.casier.habilitations;

import java.util.EnumSet;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Personne ou système agissant sur la plateforme, tel qu'authentifié par le fournisseur d'identité.
 *
 * @param identifiant      identifiant stable (sujet OpenID Connect)
 * @param nom              nom affichable
 * @param roles            rôles attribués
 * @param juridiction      juridiction de rattachement (greffes, magistrats), sinon {@code null}
 * @param organisme        organisme habilité (administrations), sinon {@code null}
 * @param identiteVerifiee identité certifiée par l'identité numérique nationale (CNIE) ou par un agent
 */
public record Acteur(String identifiant, String nom, Set<Role> roles, String juridiction, String organisme,
                     boolean identiteVerifiee) {

    public Acteur {
        Objects.requireNonNull(identifiant, "identifiant");
        roles = roles == null || roles.isEmpty() ? EnumSet.noneOf(Role.class) : EnumSet.copyOf(roles);
    }

    /** Acteur technique pour les traitements automatiques (rapprochement, émission sans intervention humaine). */
    public static Acteur systeme(String traitement) {
        return new Acteur("systeme:" + traitement, "Traitement automatique", Set.of(), null, null, false);
    }

    public boolean aLeRole(Role role) {
        return roles.contains(role);
    }

    /** Liste des codes de rôle, pour le journal d'audit. */
    public String rolesTexte() {
        return roles.stream().map(Enum::name).sorted().collect(Collectors.joining(","));
    }
}
