package com.neamindustry.casier.bulletins;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * BUL-01 à BUL-05.
 *
 * @param adresseVerification adresse publique de vérification, imprimée sur le bulletin et encodée dans le QR code
 * @param specimen            filigrane « Spécimen — sans valeur officielle » imposé (démonstration, ENV-01)
 * @param sceau               certificat du sceau électronique (aucun secret dans la configuration versionnée, SEC-05)
 */
@ConfigurationProperties("casier.bulletins")
public record ParametresBulletins(String adresseVerification, boolean specimen, Sceau sceau) {

    public ParametresBulletins {
        adresseVerification = adresseVerification == null || adresseVerification.isBlank()
                ? "https://casier-judiciaire.neamindustry.com" : adresseVerification.replaceAll("/+$", "");
        sceau = sceau == null ? new Sceau(null, null, null, false) : sceau;
    }

    /**
     * @param magasin          chemin du magasin PKCS#12 (certificat qualifié ANINF) ; absent : certificat de démonstration
     * @param motDePasse       mot de passe du magasin (variable d'environnement)
     * @param alias            alias de la clé dans le magasin
     * @param exigerCertificat refuser de démarrer sans certificat (production)
     */
    public record Sceau(String magasin, String motDePasse, String alias, boolean exigerCertificat) {
    }
}
