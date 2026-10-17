package com.neamindustry.casier.identification;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** IDT-02 : comparaison tolérante des noms. */
class ComparateurNomsTest {

    @Test
    @DisplayName("IDT-02 : accents, casse, traits d'union et espaces multiples sont neutralisés")
    void normalisation() {
        assertThat(NormalisationNoms.normaliser("  Ndong-Mba   Éyéghé ")).isEqualTo("NDONG MBA EYEGHE");
        assertThat(NormalisationNoms.normaliser("N'Goua Œlle")).isEqualTo("N GOUA OLLE");
        assertThat(NormalisationNoms.normaliser(null)).isEmpty();
    }

    @Test
    @DisplayName("IDT-02 : la clé de recherche ne dépend pas de l'ordre noms / prénoms")
    void cleRechercheIndependanteDeLOrdre() {
        assertThat(NormalisationNoms.cleRecherche("Ndong Mba", "Jean-Pierre"))
                .isEqualTo(NormalisationNoms.cleRecherche("Jean Pierre", "MBA NDONG"));
    }

    @Test
    @DisplayName("IDT-02 : ordre des mots inversé et accents donnent une similarité parfaite")
    void ordreEtAccents() {
        assertThat(ComparateurNoms.similarite("Ndong Mba Éric", "ERIC MBA NDONG")).isEqualTo(1.0);
    }

    @Test
    @DisplayName("IDT-02 : variantes orthographiques et translittérations restent très proches")
    void variantes() {
        assertThat(ComparateurNoms.similarite("Mohamed", "Mohammed")).isGreaterThan(0.95);
        assertThat(ComparateurNoms.similarite("Philippe", "Filipe")).isGreaterThan(0.85);
        assertThat(ComparateurNoms.similarite("Moussavou", "Musavou")).isGreaterThan(0.9);
    }

    @Test
    @DisplayName("IDT-02 : nom composé avec ou sans trait d'union")
    void nomsComposes() {
        assertThat(ComparateurNoms.similarite("Ondo-Mintsa", "ONDOMINTSA")).isGreaterThan(0.95);
    }

    @Test
    @DisplayName("IDT-02 : deux noms sans rapport restent éloignés")
    void nomsDifferents() {
        assertThat(ComparateurNoms.similarite("Obiang Paul", "Moussavou Christelle")).isLessThan(0.6);
        assertThat(ComparateurNoms.similarite("", "Obiang")).isZero();
    }

    @Test
    @DisplayName("IDT-02 : un prénom manquant pénalise sans annuler la ressemblance")
    void motManquant() {
        double s = ComparateurNoms.similarite("Nguema Jean", "Nguema Jean Rodrigue");
        assertThat(s).isBetween(0.6, 0.95);
    }
}
