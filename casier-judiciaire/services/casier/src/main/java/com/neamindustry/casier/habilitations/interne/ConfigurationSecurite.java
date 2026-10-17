package com.neamindustry.casier.habilitations.interne;

import java.util.Collection;
import java.util.List;
import java.util.Map;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;

/**
 * Sécurité HTTP : API sans état authentifiée par jeton OpenID Connect (Keycloak) ;
 * seuls la vérification publique, les tarifs, le suivi de dossier et la santé sont ouverts (SEC-01, SEC-04) ;
 * les notifications des opérateurs de paiement sont authentifiées par signature (PAY-02).
 */
@Configuration(proxyBeanMethods = false)
class ConfigurationSecurite {

    @Bean
    SecurityFilterChain chaineSecurite(HttpSecurity http) throws Exception {
        http
                .csrf(c -> c.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(a -> a
                        .requestMatchers("/api/public/**", "/api/operateurs/**", "/actuator/health/**", "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        .anyRequest().authenticated())
                .oauth2ResourceServer(o -> o.jwt(j -> j.jwtAuthenticationConverter(convertisseur())))
                .headers(h -> h
                        .contentSecurityPolicy(c -> c.policyDirectives("default-src 'none'; frame-ancestors 'none'"))
                        .referrerPolicy(r -> r.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER))
                        .httpStrictTransportSecurity(Customizer.withDefaults()));
        return http.build();
    }

    static Converter<Jwt, AbstractAuthenticationToken> convertisseur() {
        return jwt -> {
            Object realm = jwt.getClaim("realm_access");
            Collection<?> roles = realm instanceof Map<?, ?> m && m.get("roles") instanceof Collection<?> c ? c : List.of();
            return new JwtAuthenticationToken(jwt, roles.stream().map(r -> new SimpleGrantedAuthority("ROLE_" + r)).toList());
        };
    }
}
