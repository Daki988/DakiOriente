package com.neamindustry.casier.commun;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Réponses d'erreur au format « problem+json » : un message clair qui dit quoi corriger,
 * jamais de trace technique (ERG-05).
 */
@RestControllerAdvice
class GestionErreursWeb {

    private static final Logger SECURITE = LoggerFactory.getLogger("casier.securite");

    @ExceptionHandler(ErreurMetier.class)
    ProblemDetail erreurMetier(ErreurMetier e) {
        if ("REG-09".equals(e.code())) {
            // SEC-13 : alerte de sécurité, reprise par la supervision (journal « casier.securite »).
            SECURITE.error("ALERTE SÉCURITÉ {} : {}", e.code(), e.getMessage());
        }
        HttpStatus statut = switch (e.nature()) {
            case INTROUVABLE -> HttpStatus.NOT_FOUND;
            case ACCES_REFUSE -> HttpStatus.FORBIDDEN;
            case CONFLIT -> HttpStatus.CONFLICT;
            case REGLE_METIER -> HttpStatus.UNPROCESSABLE_CONTENT;
        };
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(statut, e.getMessage());
        pd.setProperty("code", e.code());
        return pd;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ProblemDetail saisieInvalide(MethodArgumentNotValidException e) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Certains champs sont incomplets ou invalides.");
        pd.setProperty("champs", e.getBindingResult().getFieldErrors().stream()
                .map(f -> f.getField() + " : " + f.getDefaultMessage()).toList());
        return pd;
    }
}
