import { formaterAdresse, lienItineraire, texteWhatsApp, lienWhatsApp, type Adresse } from "../../../src/index.ts";
import { ActionRapide, Badge, BarreNavigation, Bouton } from "../components/ui.tsx";
import { resoudre, type Enregistrement } from "../stockage.ts";

async function partager(a: Adresse) {
  const text = texteWhatsApp(a, window.location.origin);
  if (navigator.share) {
    try {
      await navigator.share({ title: "Mon adresse", text });
      return;
    } catch {
      /* partage annulé : on retombe sur WhatsApp */
    }
  }
  window.open(lienWhatsApp(a, window.location.origin), "_blank", "noopener");
}

export function Accueil({ adresses, onCreer }: { adresses: Enregistrement[]; onCreer: () => void }) {
  const [mienne, ...autres] = adresses;
  const a = mienne ? resoudre(mienne) : null;
  const lignes = a ? formaterAdresse(a) : [];

  return (
    <div className="ecran">
      <main className="contenu">
        <header className="entete">
          <div>
            <div className="salut">Mbolo 👋</div>
            <h1 className="logo">nda</h1>
          </div>
          <div className="avatar" aria-hidden />
        </header>

        {a ? (
          <section className="hero" aria-label="Mon adresse">
            <div className="hero__haut">
              <span className="hero__titre">MON ADRESSE</span>
              {a.voie ? <Badge>Voie officielle</Badge> : <Badge attente>Voie sans nom</Badge>}
            </div>
            <p className="hero__adresse">
              {lignes[0]}
              <br />
              {a.quartier ? `${a.quartier}, ${a.zone.commune}` : a.zone.commune}
            </p>
            <div className="hero__code">
              Code Nda <span className="puce-code">{a.code}</span>
            </div>
            <div className="hero__actions">
              <Bouton variante="accent" onClick={() => partager(a)}>Partager</Bouton>
              <Bouton variante="secondary" onClick={() => window.open(lienItineraire(a), "_blank", "noopener")}>Voir la carte</Bouton>
            </div>
          </section>
        ) : (
          <section className="hero hero--vide" aria-label="Mon adresse">
            <span className="hero__titre">MON ADRESSE</span>
            <p className="hero__adresse">Tu n'as pas encore d'adresse Nda.</p>
            <Bouton variante="accent" onClick={onCreer}>Créer mon adresse</Bouton>
          </section>
        )}

        <h2 className="h-section">Actions rapides</h2>
        <div className="actions">
          <ActionRapide glyphe="+" libelle="Créer une adresse" onClick={onCreer} />
          <ActionRapide glyphe="⌕" libelle="Trouver une adresse" bientot />
          <ActionRapide glyphe="▣" libelle="Scanner une plaque" bientot />
        </div>

        <div className="carte carte--astuce">
          <strong>Basée sur l'adressage officiel</strong>
          <p>
            Ton adresse reprend le nom de voie officiel et le numéro de porte du projet d'adressage. Là où la voie n'a pas encore de
            nom, Nda génère un code compatible.
          </p>
        </div>

        <h2 className="h-section">Adresses enregistrées</h2>
        <div className="carte liste">
          {autres.length === 0 && <p className="vide">Tes anciennes adresses et celles qu'on te partage apparaîtront ici.</p>}
          {autres.map((e) => {
            const x = resoudre(e);
            if (!x) return null;
            return (
              <div className="ligne" key={e.id}>
                <span className="ligne__point" aria-hidden />
                <div className="ligne__texte">
                  <strong>{e.libelle}</strong>
                  <span>{formaterAdresse(x).slice(0, 2).join(" · ")}</span>
                </div>
                <span className="mono">{x.code}</span>
              </div>
            );
          })}
        </div>
      </main>
      <BarreNavigation />
    </div>
  );
}
