package com.neamindustry.casier;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

/** ARC-02 : modules indépendants ; chacun n'expose que son paquet racine, le reste (interne, web) est privé. */
class ArchitectureModulaireTest {

    @Test
    @DisplayName("ARC-02 : structure modulaire respectée, aucun cycle, aucun accès à un paquet interne d'un autre module")
    void structureModulaire() {
        ApplicationModules.of(ServiceCasierApplication.class).verify();
    }
}
