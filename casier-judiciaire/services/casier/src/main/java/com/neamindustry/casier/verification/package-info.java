/**
 * Vérification publique des bulletins (section 13, BUL-06 à BUL-11). Base propre, limitée au jeton haché,
 * au statut et à l'identité minimale, alimentée par événements : une attaque sur la vérification n'expose pas le casier (ARC-01).
 */
@ApplicationModule(displayName = "Vérification publique")
package com.neamindustry.casier.verification;

import org.springframework.modulith.ApplicationModule;
