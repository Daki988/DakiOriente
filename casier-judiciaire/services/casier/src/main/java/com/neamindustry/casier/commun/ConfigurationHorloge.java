package com.neamindustry.casier.commun;

import java.time.Clock;
import java.time.ZoneId;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Horloge unique, injectable et remplaçable en test. Fuseau : Libreville. */
@Configuration(proxyBeanMethods = false)
class ConfigurationHorloge {

    static final ZoneId LIBREVILLE = ZoneId.of("Africa/Libreville");

    @Bean
    Clock horloge() {
        return Clock.system(LIBREVILLE);
    }
}
