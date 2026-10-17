package com.neamindustry.casier.identification;

import java.util.List;

/**
 * Issue du rapprochement (IDT-03) et explication journalisable de la décision.
 *
 * @param issue          correspondance certaine, absence certaine ou cas douteux
 * @param candidatRetenu référence de la fiche retenue en cas de correspondance certaine, sinon {@code null}
 * @param scores         scores détaillés des candidats examinés, du meilleur au moins bon
 * @param explication    motif de la décision, en clair
 */
public record ResultatRapprochement(Issue issue, String candidatRetenu, List<ScoreCandidat> scores, String explication) {

    public enum Issue { CORRESPONDANCE_CERTAINE, ABSENCE_CERTAINE, CAS_DOUTEUX }

    public record ScoreCandidat(String reference, double score, double similariteNoms, boolean dateNaissanceExacte,
                                List<String> details) {
    }
}
