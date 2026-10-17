package com.neamindustry.casier.commun;

import java.time.Clock;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * BUL-09 : limitation du nombre d'appels publics par adresse réseau (fenêtre fixe d'une minute), contre l'énumération
 * des jetons, codes et numéros de dossier. En production, le pare-feu applicatif ajoute sa propre limitation (SEC-04).
 */
@Component
public class LimiteurDebit {

    @ConfigurationProperties("casier.public")
    public record Parametres(int limiteParMinute) {
        public Parametres {
            limiteParMinute = limiteParMinute <= 0 ? 30 : limiteParMinute;
        }
    }

    private record Fenetre(long minute, int compte) {
    }

    private final ConcurrentHashMap<String, Fenetre> fenetres = new ConcurrentHashMap<>();
    private final Parametres parametres;
    private final Clock horloge;

    LimiteurDebit(Parametres parametres, Clock horloge) {
        this.parametres = parametres;
        this.horloge = horloge;
    }

    public boolean autoriser(String adresse) {
        long minute = horloge.millis() / 60_000;
        if (fenetres.size() > 100_000) {
            fenetres.entrySet().removeIf(e -> e.getValue().minute() < minute);
        }
        Fenetre f = fenetres.merge(adresse, new Fenetre(minute, 1),
                (ancienne, nouvelle) -> ancienne.minute() == minute ? new Fenetre(minute, ancienne.compte() + 1) : nouvelle);
        return f.compte() <= parametres.limiteParMinute();
    }
}
