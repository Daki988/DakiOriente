package com.neamindustry.casier.reclamations;

import java.time.Instant;
import java.util.UUID;

/** Réclamation telle que la voient l'usager et le support. L'agent n'est jamais désigné par son nom. */
public record Reclamation(UUID id, String numero, String numeroDossier, CategorieReclamation categorie, String message,
                          StatutReclamation statut, Instant creeLe, Instant prisEnChargeLe, String reponse, Instant traiteLe) {
}
