package com.neamindustry.casier.registre;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.neamindustry.casier.identification.ProfilIdentite;
import com.neamindustry.casier.registre.interne.DepotRegistre;

/**
 * Lecture du registre pour les autres modules. Chaque lecture contrôle les empreintes (REG-09).
 * La journalisation des consultations incombe au module appelant, qui connaît la finalité.
 */
@Service
@Transactional(readOnly = true)
public class RegistreLecture {

    private final DepotRegistre depot;

    RegistreLecture(DepotRegistre depot) {
        this.depot = depot;
    }

    /** Fiche avec les seules condamnations validées en vigueur (non remplacées) et leurs mentions validées. */
    public Optional<FicheCasier> fiche(UUID personneId) {
        return depot.personne(personneId).map(p -> {
            List<CondamnationEnregistree> toutes = depot.condamnationsDe(personneId);
            List<CondamnationEnregistree> validees = toutes.stream()
                    .filter(c -> c.statut() == StatutInscription.VALIDEE)
                    .map(c -> new CondamnationEnregistree(c.id(), c.personneId(), c.version(), c.remplaceId(), c.juridiction(),
                            c.dateDecision(), c.numeroDecision(), c.infraction(), c.qualification(), c.peines(),
                            c.dateDefinitive(), c.referencePieceSource(), c.statut(), c.saisiePar(), c.saisieLe(),
                            c.valideePar(), c.valideeLe(),
                            c.mentions().stream().filter(m -> m.statut() == StatutInscription.VALIDEE).toList()))
                    .toList();
            List<String> motifs = new ArrayList<>(depot.motifsBlocageOuverts(personneId));
            // RG-07, choix prudent : toute inscription, correction ou mention en attente bloque l'émission automatique.
            if (toutes.stream().anyMatch(c -> c.statut() == StatutInscription.SAISIE)) {
                motifs.add("Inscription ou correction en attente de validation");
            }
            if (toutes.stream().flatMap(c -> c.mentions().stream()).anyMatch(m -> m.statut() == StatutInscription.SAISIE)) {
                motifs.add("Mention en attente de validation");
            }
            return new FicheCasier(personneId, p.identite(), validees, motifs);
        });
    }

    /** IDT-01 : fiches candidates, sous la forme attendue par le rapprochement. */
    public List<ProfilIdentite> candidats(String nom, String prenoms, LocalDate dateNaissance, String cnie, String passeport) {
        return depot.candidats(nom, prenoms, dateNaissance, cnie, passeport).stream()
                .map(p -> new ProfilIdentite(p.id().toString(), p.identite().nom(), p.identite().prenoms(),
                        p.identite().dateNaissance(), p.identite().lieuNaissance(), p.identite().nomPere(),
                        p.identite().nomMere(), p.identite().numeroCnie(), p.identite().numeroPasseport(), p.identite().alias()))
                .toList();
    }

    public List<CondamnationEnregistree> historique(UUID personneId) {
        return depot.condamnationsDe(personneId);
    }
}
