package com.neamindustry.casier.identification;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.neamindustry.casier.identification.ResultatRapprochement.Issue;

/**
 * IDT-01, IDT-03, RG-06 : trois issues, prudence face aux homonymes.
 * Toutes les identités sont fictives (DON-06).
 */
class RapprochementTest {

    private final Rapprochement rapprochement = new Rapprochement(SeuilsIdentification.parDefaut());

    private static final LocalDate NE_LE = LocalDate.of(1988, 3, 14);

    private static ProfilIdentite demandeur() {
        return new ProfilIdentite("demande", "Ndong Mba", "Jean-Pierre", NE_LE, "Oyem", "Ndong Ella Paul", "Mengue Marie",
                null, null, List.of());
    }

    private static ProfilIdentite fiche(String ref, String nom, String prenoms, LocalDate date, String lieu) {
        return new ProfilIdentite(ref, nom, prenoms, date, lieu, "Ndong Ella Paul", "Mengue Marie", null, null, List.of());
    }

    @Test
    @DisplayName("IDT-03 : registre sans candidat → absence certaine")
    void aucunCandidat() {
        ResultatRapprochement r = rapprochement.rapprocher(demandeur(), List.of());
        assertThat(r.issue()).isEqualTo(Issue.ABSENCE_CERTAINE);
    }

    @Test
    @DisplayName("IDT-03 : même identité, noms inversés et sans accents → correspondance certaine")
    void correspondanceCertaine() {
        ProfilIdentite f = fiche("F1", "JEAN PIERRE", "MBA NDONG", NE_LE, "OYEM");
        ResultatRapprochement r = rapprochement.rapprocher(demandeur(), List.of(f));
        assertThat(r.issue()).isEqualTo(Issue.CORRESPONDANCE_CERTAINE);
        assertThat(r.candidatRetenu()).isEqualTo("F1");
        assertThat(r.explication()).contains("F1");
    }

    @Test
    @DisplayName("RG-06 : homonyme parfait né un autre jour → cas douteux, jamais un néant automatique")
    void homonymeDateDifferente() {
        ProfilIdentite f = new ProfilIdentite("F2", "Ndong Mba", "Jean-Pierre", LocalDate.of(1975, 11, 2), "Libreville",
                null, null, null, null, List.of());
        ResultatRapprochement r = rapprochement.rapprocher(demandeur(), List.of(f));
        assertThat(r.issue()).isEqualTo(Issue.CAS_DOUTEUX);
        assertThat(r.explication()).contains("homonymie");
    }

    @Test
    @DisplayName("IDT-03 : personne sans rapport → absence certaine, avec explication des seuils")
    void personneDifferente() {
        ProfilIdentite f = new ProfilIdentite("F3", "Moussavou", "Christelle", LocalDate.of(1992, 7, 30), "Mouila",
                "Moussavou Jean", "Ibinga Rose", null, null, List.of());
        ResultatRapprochement r = rapprochement.rapprocher(demandeur(), List.of(f));
        assertThat(r.issue()).isEqualTo(Issue.ABSENCE_CERTAINE);
        assertThat(r.explication()).contains("même partiellement");
    }

    @Test
    @DisplayName("IDT-02 : jour et mois inversés → cas douteux soumis à un agent")
    void jourMoisInverses() {
        ProfilIdentite inverse = fiche("F4", "Ndong Mba", "Jean-Pierre", LocalDate.of(1988, 4, 3), "Oyem");
        ResultatRapprochement r = rapprochement.rapprocher(
                new ProfilIdentite("d", "Ndong Mba", "Jean-Pierre", LocalDate.of(1988, 3, 4), "Oyem", null, null, null, null, List.of()),
                List.of(inverse));
        assertThat(r.issue()).isEqualTo(Issue.CAS_DOUTEUX);
        assertThat(r.scores().getFirst().details()).anyMatch(d -> d.startsWith("date de naissance 0.70"));
    }

    @Test
    @DisplayName("IDT-03 : deux fiches identiques (doublon) → cas douteux, fusion par le greffier en chef (IDT-06)")
    void doublon() {
        ResultatRapprochement r = rapprochement.rapprocher(demandeur(), List.of(
                fiche("F5", "Ndong Mba", "Jean-Pierre", NE_LE, "Oyem"),
                fiche("F6", "Ndong Mba", "Jean Pierre", NE_LE, "Oyem")));
        assertThat(r.issue()).isEqualTo(Issue.CAS_DOUTEUX);
        assertThat(r.explication()).contains("trop proches");
        assertThat(r.scores()).hasSize(2);
    }

    @Test
    @DisplayName("IDT-01 : même numéro de CNIE et identité cohérente → correspondance certaine")
    void memeCnie() {
        ProfilIdentite d = new ProfilIdentite("d", "Ndong Mba", "Jean-Pierre", NE_LE, null, null, null, "GA-1234-5678", null, List.of());
        ProfilIdentite f = new ProfilIdentite("F7", "NDONG MBA", "JEAN PIERRE", NE_LE, null, null, null, "ga12345678", null, List.of());
        ResultatRapprochement r = rapprochement.rapprocher(d, List.of(f));
        assertThat(r.issue()).isEqualTo(Issue.CORRESPONDANCE_CERTAINE);
        assertThat(r.scores().getFirst().details()).contains("numéro de pièce identique");
    }

    @Test
    @DisplayName("IDT-01 : même CNIE mais nom incohérent → cas douteux")
    void memeCnieIdentiteIncoherente() {
        ProfilIdentite d = new ProfilIdentite("d", "Ndong Mba", "Jean-Pierre", NE_LE, null, null, null, "GA-1234-5678", null, List.of());
        ProfilIdentite f = new ProfilIdentite("F8", "Obame", "Sylvie", LocalDate.of(1970, 1, 1), null, null, null, "GA-1234-5678", null, List.of());
        ResultatRapprochement r = rapprochement.rapprocher(d, List.of(f));
        assertThat(r.issue()).isEqualTo(Issue.CAS_DOUTEUX);
    }

    @Test
    @DisplayName("IDT-01 : numéros de CNIE différents interdisent la certitude automatique")
    void cnieDifferentes() {
        ProfilIdentite d = new ProfilIdentite("d", "Ndong Mba", "Jean-Pierre", NE_LE, "Oyem", null, null, "GA-1111", null, List.of());
        ProfilIdentite f = new ProfilIdentite("F9", "Ndong Mba", "Jean-Pierre", NE_LE, "Oyem", null, null, "GA-2222", null, List.of());
        ResultatRapprochement r = rapprochement.rapprocher(d, List.of(f));
        assertThat(r.issue()).isEqualTo(Issue.CAS_DOUTEUX);
        assertThat(r.scores().getFirst().details()).contains("numéros de pièce différents");
    }

    @Test
    @DisplayName("IDT-01 : un alias connu de la fiche permet la correspondance")
    void alias() {
        ProfilIdentite f = new ProfilIdentite("F10", "Ella", "Rodrigue", NE_LE, "Oyem", "Ndong Ella Paul", "Mengue Marie",
                null, null, List.of("Ndong Mba Jean-Pierre"));
        ResultatRapprochement r = rapprochement.rapprocher(demandeur(), List.of(f));
        assertThat(r.issue()).isEqualTo(Issue.CORRESPONDANCE_CERTAINE);
    }

    @Test
    @DisplayName("RG-06 : un frère (même nom de famille, mêmes parents) déclenche un cas douteux")
    void frere() {
        ProfilIdentite f = fiche("F11", "Ndong Mba", "Paul", LocalDate.of(1991, 5, 20), "Oyem");
        ResultatRapprochement r = rapprochement.rapprocher(demandeur(), List.of(f));
        assertThat(r.issue()).isEqualTo(Issue.CAS_DOUTEUX);
    }

    @Test
    @DisplayName("IDT-03 : les seuils sont paramétrables")
    void seuilsParametrables() {
        Rapprochement strict = new Rapprochement(new SeuilsIdentification(0.999, 0.55, 0.85, 0.08));
        ProfilIdentite f = fiche("F12", "Ndong Mba", "Jean Pierre", NE_LE, "Oyem-Centre");
        assertThat(strict.rapprocher(demandeur(), List.of(f)).issue()).isEqualTo(Issue.CAS_DOUTEUX);
        assertThat(rapprochement.rapprocher(demandeur(), List.of(f)).issue()).isEqualTo(Issue.CORRESPONDANCE_CERTAINE);
    }

    @Test
    @DisplayName("IDT-02 : tolérance des dates (année décalée, même mois, même année)")
    void similariteDates() {
        assertThat(Rapprochement.similariteDates(NE_LE, NE_LE.plusYears(1))).isEqualTo(0.5);
        assertThat(Rapprochement.similariteDates(NE_LE, NE_LE.withDayOfMonth(2))).isEqualTo(0.5);
        assertThat(Rapprochement.similariteDates(NE_LE, NE_LE.withMonth(9))).isEqualTo(0.25);
        assertThat(Rapprochement.similariteDates(NE_LE, LocalDate.of(1960, 1, 1))).isZero();
        assertThat(Rapprochement.similariteDates(null, NE_LE)).isNull();
    }
}
