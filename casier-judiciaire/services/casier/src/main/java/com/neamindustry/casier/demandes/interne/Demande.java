package com.neamindustry.casier.demandes.interne;

import java.time.Instant;
import java.util.UUID;

import com.neamindustry.casier.demandes.IdentiteDeclaree;
import com.neamindustry.casier.demandes.ProfilDemandeur;
import com.neamindustry.casier.demandes.StatutDemande;

/** Demande telle que stockée dans le schéma {@code demandes}. */
public record Demande(UUID id, String numeroDossier, String empreinteCodeSuivi, ProfilDemandeur profil,
                      IdentiteDeclaree identite, String demandeurId, boolean identiteVerifiee, StatutDemande statut,
                      long montantFcfa, boolean tarifProvisoire, String referencePaiement, Instant creeLe, Instant payeLe,
                      Instant echeance, Instant suspenduDepuis, UUID personneRapprochee, String issueRapprochement,
                      String explicationRapprochement, String motifAgent, UUID bulletinId, String bulletinNumero,
                      String motifRejet) {
}
