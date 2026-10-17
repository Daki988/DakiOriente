package com.neamindustry.casier.commun;

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

    @ExceptionHandler(ErreurMetier.class)
    ProblemDetail erreurMetier(ErreurMetier e) {
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
