package com.neamindustry.casier;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/**
 * Service Casier : registre national, demandes, bulletins et vérification (section 18).
 * Monolithe modulaire, un module par paquet de premier niveau (ADR 0001).
 */
@SpringBootApplication
@ConfigurationPropertiesScan
public class ServiceCasierApplication {

    public static void main(String[] args) {
        SpringApplication.run(ServiceCasierApplication.class, args);
    }
}
