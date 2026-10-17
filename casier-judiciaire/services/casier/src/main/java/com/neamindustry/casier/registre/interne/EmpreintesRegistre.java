package com.neamindustry.casier.registre.interne;

import java.util.UUID;
import java.util.stream.Collectors;

import com.neamindustry.casier.commun.Empreintes;
import com.neamindustry.casier.commun.Peine;
import com.neamindustry.casier.registre.CondamnationEnregistree;
import com.neamindustry.casier.registre.IdentitePersonne;
import com.neamindustry.casier.registre.MentionEnregistree;

/** REG-09 : empreintes des fiches, condamnations et mentions, recalculées à chaque lecture. */
public final class EmpreintesRegistre {

    private EmpreintesRegistre() {
    }

    public static String personne(UUID id, IdentitePersonne i) {
        return Empreintes.sha256(Empreintes.canonique(id, i.nom(), i.prenoms(), i.dateNaissance(), i.lieuNaissance(),
                i.paysNaissance(), i.nomPere(), i.nomMere(), String.join("|", i.nationalites()), i.numeroCnie(),
                i.numeroPasseport(), String.join("|", i.alias())));
    }

    public static String condamnation(CondamnationEnregistree c) {
        String peines = c.peines().stream().map(Peine::canonique).collect(Collectors.joining("|"));
        return Empreintes.sha256(Empreintes.canonique(c.id(), c.personneId(), c.version(), c.remplaceId(), c.juridiction(),
                c.dateDecision(), c.numeroDecision(), c.infraction(), c.qualification(), peines, c.dateDefinitive(),
                c.referencePieceSource(), c.statut(), c.saisiePar(), c.valideePar()));
    }

    public static String mention(MentionEnregistree m) {
        return Empreintes.sha256(Empreintes.canonique(m.id(), m.condamnationId(), m.type(), m.dateEffet(), m.details(),
                m.statut(), m.saisiePar(), m.valideePar()));
    }
}
