package com.neamindustry.casier.bulletins;

import java.time.Instant;
import java.util.UUID;

/** BUL-10 : un bulletin émis par erreur est révoqué ; la vérification l'affiche « révoqué ». */
public record BulletinRevoque(UUID bulletinId, String empreinteJeton, Instant revoqueLe) {
}
