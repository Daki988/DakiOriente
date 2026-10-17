package com.neamindustry.casier.demandes;

import java.util.UUID;

/**
 * Accusé de dépôt. Le code de suivi n'existe en clair qu'ici (envoyé par SMS, PUB-07) ; seule son empreinte est conservée.
 */
public record DemandeDeposee(UUID id, String numeroDossier, String codeSuivi, long montantFcfa, boolean tarifProvisoire) {
}
