package com.neamindustry.casier.regles;

import static com.neamindustry.casier.commun.Qualification.*;
import static com.neamindustry.casier.regles.ReglesFictives.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.neamindustry.casier.commun.Sursis;
import com.neamindustry.casier.commun.TypeBulletin;
import com.neamindustry.casier.commun.TypeMention;

/** RG-04, RG-11 : le contenu de chaque bulletin découle du jeu de règles, jamais du code. */
class CalculateurBulletinTest {

    private static final LocalDate AUJOURDHUI = LocalDate.of(2026, 10, 16);
    private static final ReglesBulletins REGLES = contenu(true);

    private static ResultatCalcul calculer(TypeBulletin type, CondamnationPourCalcul... c) {
        return CalculateurBulletin.calculer(REGLES, 7, type, List.of(c), AUJOURDHUI);
    }

    @Test
    @DisplayName("RG-04 : une amende pour délit n'apparaît pas au B3 (prison seule retenue), le B3 est néant")
    void amendeAbsenteDuB3() {
        ResultatCalcul r = calculer(TypeBulletin.B3, condamnation("C1", LocalDate.of(2024, 5, 2), DELIT, List.of(amende(50_000))));
        assertThat(r.neant()).isTrue();
        assertThat(r.exclusions()).singleElement().extracting(ResultatCalcul.Exclusion::motif)
                .asString().contains("Aucune peine retenue");
        assertThat(r.versionRegles()).isEqualTo(7);
    }

    @Test
    @DisplayName("RG-04 : un emprisonnement ferme pour délit figure au B3")
    void prisonFermeAuB3() {
        ResultatCalcul r = calculer(TypeBulletin.B3, condamnation("C2", LocalDate.of(2023, 1, 10), DELIT, List.of(prison(6, Sursis.AUCUN))));
        assertThat(r.retenues()).containsExactly("C2");
        assertThat(r.neant()).isFalse();
    }

    @Test
    @DisplayName("RG-04 : sursis total exclu du B3, sauf révocation du sursis")
    void sursisTotal() {
        CondamnationPourCalcul avecSursis = condamnation("C3", LocalDate.of(2023, 1, 10), DELIT, List.of(prison(6, Sursis.TOTAL)));
        assertThat(calculer(TypeBulletin.B3, avecSursis).neant()).isTrue();
        CondamnationPourCalcul revoque = condamnation("C3", LocalDate.of(2023, 1, 10), DELIT, List.of(prison(6, Sursis.TOTAL)),
                mention(TypeMention.REVOCATION_SURSIS, LocalDate.of(2025, 2, 1)));
        assertThat(calculer(TypeBulletin.B3, revoque).retenues()).containsExactly("C3");
    }

    @Test
    @DisplayName("RG-04 : le B3 retient l'emprisonnement pour délit mais pas la contravention")
    void contraventionExclue() {
        ResultatCalcul r = calculer(TypeBulletin.B3,
                condamnation("C4", LocalDate.of(2024, 3, 3), DELIT, List.of(prison(3, Sursis.AUCUN))),
                condamnation("C5", LocalDate.of(2025, 3, 3), CONTRAVENTION, List.of(prison(1, Sursis.AUCUN))));
        assertThat(r.retenues()).containsExactly("C4");
        assertThat(r.exclusions()).extracting(ResultatCalcul.Exclusion::reference).containsExactly("C5");
    }

    @Test
    @DisplayName("RG-04 : la réhabilitation retire la condamnation du B3")
    void rehabilitation() {
        CondamnationPourCalcul c = condamnation("C6", LocalDate.of(2015, 6, 1), CRIME, List.of(prison(36, Sursis.AUCUN)),
                mention(TypeMention.REHABILITATION, LocalDate.of(2024, 6, 1)));
        assertThat(calculer(TypeBulletin.B3, c).neant()).isTrue();
    }

    @Test
    @DisplayName("RG-04 : l'amnistie retire la condamnation du B3")
    void amnistie() {
        CondamnationPourCalcul c = condamnation("C7", LocalDate.of(2020, 6, 1), DELIT, List.of(prison(4, Sursis.AUCUN)),
                mention(TypeMention.AMNISTIE, LocalDate.of(2022, 1, 1)));
        assertThat(calculer(TypeBulletin.B3, c).exclusions()).singleElement()
                .extracting(ResultatCalcul.Exclusion::motif).isEqualTo("Amnistie");
    }

    @Test
    @DisplayName("RG-04 : une mention postérieure à la date de l'état du casier est ignorée (RG-05)")
    void mentionFuture() {
        CondamnationPourCalcul c = condamnation("C8", LocalDate.of(2020, 6, 1), DELIT, List.of(prison(4, Sursis.AUCUN)),
                mention(TypeMention.AMNISTIE, AUJOURDHUI.plusDays(3)));
        assertThat(calculer(TypeBulletin.B3, c).retenues()).containsExactly("C8");
    }

    @Test
    @DisplayName("RG-11 : délai d'effacement atteint → condamnation retirée de tous les bulletins (effacement automatique)")
    void effacementAutomatique() {
        CondamnationPourCalcul c = condamnation("C9", LocalDate.of(2012, 4, 1), DELIT, List.of(prison(12, Sursis.AUCUN)));
        assertThat(calculer(TypeBulletin.B3, c).neant()).isTrue();
        assertThat(calculer(TypeBulletin.B3, c).exclusions().getFirst().motif()).contains("10 ans");
    }

    @Test
    @DisplayName("RG-11 : sans effacement automatique, la condamnation reste et passe en validation du greffier en chef")
    void effacementAValider() {
        CondamnationPourCalcul c = condamnation("C9", LocalDate.of(2012, 4, 1), DELIT, List.of(prison(12, Sursis.AUCUN)));
        ResultatCalcul r = CalculateurBulletin.calculer(contenu(false), 1, TypeBulletin.B3, List.of(c), AUJOURDHUI);
        assertThat(r.retenues()).containsExactly("C9");
        assertThat(r.effacementsAValider()).containsExactly("C9");
    }

    @Test
    @DisplayName("RG-11 : une mention d'effacement validée retire la condamnation")
    void mentionEffacement() {
        CondamnationPourCalcul c = condamnation("C10", LocalDate.of(2022, 4, 1), CRIME, List.of(prison(60, Sursis.AUCUN)),
                mention(TypeMention.EFFACEMENT, LocalDate.of(2026, 1, 1)));
        assertThat(calculer(TypeBulletin.B3, c).neant()).isTrue();
    }

    @Test
    @DisplayName("RG-04 : décision non définitive exclue ; décision postérieure à l'état du casier exclue")
    void nonDefinitiveEtFuture() {
        CondamnationPourCalcul nonDefinitive = new CondamnationPourCalcul("C11", LocalDate.of(2026, 9, 1), DELIT,
                List.of(prison(3, Sursis.AUCUN)), false, List.of());
        CondamnationPourCalcul future = condamnation("C12", AUJOURDHUI.plusDays(1), DELIT, List.of(prison(3, Sursis.AUCUN)));
        ResultatCalcul r = calculer(TypeBulletin.B3, nonDefinitive, future);
        assertThat(r.neant()).isTrue();
        assertThat(r.exclusions()).extracting(ResultatCalcul.Exclusion::motif)
                .containsExactly("Décision non définitive", "Décision postérieure à la date de l'état du casier");
    }

    @Test
    @DisplayName("RG-04 : au B3, une peine avec sursis partiel non révoqué disparaît après le délai paramétré")
    void sursisPartiel() {
        CondamnationPourCalcul ancienne = condamnation("C13", LocalDate.of(2019, 1, 1), DELIT, List.of(prison(12, Sursis.PARTIEL)));
        CondamnationPourCalcul recente = condamnation("C14", LocalDate.of(2023, 1, 1), DELIT, List.of(prison(12, Sursis.PARTIEL)));
        assertThat(calculer(TypeBulletin.B3, ancienne, recente).retenues()).containsExactly("C14");
    }

    @Test
    @DisplayName("RG-04 : un type de bulletin sans règle est une erreur explicite")
    void regleManquante() {
        ReglesBulletins incomplet = new ReglesBulletins("x", Map.of(), Map.of(), true, Map.of());
        assertThatThrownBy(() -> CalculateurBulletin.calculer(incomplet, 1, TypeBulletin.B3, List.of(), AUJOURDHUI))
                .hasMessageContaining("Bulletin n°3");
    }

    @Test
    @DisplayName("ADM-05 : les cas de test d'un jeu de règles sont exécutés et les échecs nommés")
    void casDeTest() {
        CondamnationPourCalcul c = condamnation("C2", LocalDate.of(2023, 1, 10), DELIT, List.of(prison(6, Sursis.AUCUN)));
        CasDeTest ok = new CasDeTest("prison ferme au B3", TypeBulletin.B3, AUJOURDHUI, List.of(c), List.of("C2"));
        CasDeTest ko = new CasDeTest("attente erronée", TypeBulletin.B3, AUJOURDHUI, List.of(c), List.of());
        JeuDeRegles jeu = new JeuDeRegles(null, 1, AUJOURDHUI, JeuDeRegles.Statut.PROPOSE, "a", null, null, null, null,
                true, REGLES, List.of(ok, ko));
        assertThat(ParametresJuridiques.executerCasDeTest(jeu)).containsExactly("attente erronée");
    }
}
