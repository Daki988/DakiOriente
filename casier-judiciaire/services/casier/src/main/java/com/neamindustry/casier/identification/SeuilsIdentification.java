package com.neamindustry.casier.identification;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * IDT-03 : seuils paramétrables, ajustés avec les greffiers sur un jeu de cas réels anonymisés.
 *
 * @param certitude     score minimal d'une correspondance certaine (avec date de naissance exacte)
 * @param doute         sous ce score, un candidat n'est pas retenu comme correspondance partielle
 * @param nomSeul       similarité des noms à partir de laquelle un homonyme est toujours un cas douteux (RG-06)
 * @param ecartMinimal  écart minimal entre le meilleur et le second candidat pour conclure
 */
@ConfigurationProperties("casier.identification")
public record SeuilsIdentification(double certitude, double doute, double nomSeul, double ecartMinimal) {

    public SeuilsIdentification {
        certitude = certitude == 0 ? 0.90 : certitude;
        doute = doute == 0 ? 0.55 : doute;
        nomSeul = nomSeul == 0 ? 0.85 : nomSeul;
        ecartMinimal = ecartMinimal == 0 ? 0.08 : ecartMinimal;
    }

    public static SeuilsIdentification parDefaut() {
        return new SeuilsIdentification(0, 0, 0, 0);
    }
}
