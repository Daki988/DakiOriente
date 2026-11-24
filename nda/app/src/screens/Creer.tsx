import { useMemo, useRef, useState } from "react";
import { creerAdresse, ErreurAdresse, libelleZone, trouverZoneParPosition, type Point, type SaisieAdresse } from "../../../src/index.ts";
import { CarteZone } from "../components/CarteZone.tsx";
import { Bouton } from "../components/ui.tsx";
import { ZONES } from "../stockage.ts";

/** Louis, Libreville : point de départ tant que le GPS n'a pas répondu. */
const DEPART: Point = { lat: 0.4185, lon: 9.4425 };
const SANS_NOM = "__sans_nom__";
const DUREE_MAX_MS = 30_000;

export function Creer({ onRetour, onValider }: { onRetour: () => void; onValider: (s: SaisieAdresse, vocal?: string) => void }) {
  const [position, setPosition] = useState<Point>(DEPART);
  const [gps, setGps] = useState<"attente" | "ok" | "refus">("attente");
  const [precision, setPrecision] = useState<number | null>(null);
  const [quartier, setQuartier] = useState("");
  const [voieId, setVoieId] = useState("");
  const [numero, setNumero] = useState("");
  const [repere, setRepere] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [vocal, setVocal] = useState<string | undefined>();
  const [enregistre, setEnregistre] = useState(false);
  const rec = useRef<MediaRecorder | null>(null);

  const zone = useMemo(() => trouverZoneParPosition(ZONES, position.lat, position.lon), [position]);

  const localiser = () => {
    if (!navigator.geolocation) return setGps("refus");
    setGps("attente");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPosition({ lat: p.coords.latitude, lon: p.coords.longitude });
        setPrecision(Math.round(p.coords.accuracy));
        setGps("ok");
      },
      () => setGps("refus"),
      { enableHighAccuracy: true, timeout: 15_000 },
    );
  };

  const deplacer = (p: Point) => {
    setPosition(p);
    setPrecision(null);
    setQuartier("");
    setVoieId("");
  };

  const basculerVocal = async () => {
    if (enregistre) return rec.current?.stop();
    try {
      const flux = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(flux);
      const morceaux: Blob[] = [];
      r.ondataavailable = (e) => morceaux.push(e.data);
      r.onstop = () => {
        flux.getTracks().forEach((t) => t.stop());
        setEnregistre(false);
        const lecteur = new FileReader();
        lecteur.onload = () => setVocal(lecteur.result as string);
        lecteur.readAsDataURL(new Blob(morceaux, { type: r.mimeType }));
      };
      r.start();
      rec.current = r;
      setEnregistre(true);
      setTimeout(() => r.state === "recording" && r.stop(), DUREE_MAX_MS);
    } catch {
      setErreur("Micro inaccessible : autorise-le dans ton navigateur pour ajouter une consigne vocale.");
    }
  };

  const valider = () => {
    const saisie: SaisieAdresse = {
      position,
      quartier: quartier || undefined,
      voieId: voieId && voieId !== SANS_NOM ? voieId : undefined,
      numero: numero.trim() || undefined,
      repere: repere.trim() || undefined,
    };
    try {
      creerAdresse(ZONES, saisie);
      onValider(saisie, vocal);
    } catch (e) {
      setErreur(e instanceof ErreurAdresse ? e.message : "Impossible de créer l'adresse.");
    }
  };

  const libelleGps =
    gps === "ok" ? `📍 Position GPS · précision ±${precision ?? "?"} m` : gps === "refus" ? "📍 GPS indisponible · touche la carte" : precision === null && position !== DEPART ? "📍 Position placée à la main" : "📍 Me localiser";

  return (
    <div className="ecran">
      <header className="titre">
        <button className="retour" onClick={onRetour} aria-label="Retour">←</button>
        <div>
          <h1>Créer mon adresse</h1>
          <p>Position, voie et numéro</p>
        </div>
      </header>
      <div className="progression" aria-hidden>
        <span className="on" />
        <span className="on" />
        <span />
      </div>

      <div className="carte-zone">
        <CarteZone position={position} onChange={deplacer} />
        <button type="button" className="pastille-gps" onClick={localiser}>{libelleGps}</button>
      </div>

      <form className="formulaire" onSubmit={(e) => { e.preventDefault(); valider(); }}>
        <div className="champ">
          <span className="etiquette">Arrondissement · Quartier</span>
          {zone ? (
            <label className="saisie">
              <select value={quartier} onChange={(e) => setQuartier(e.target.value)} aria-label="Quartier">
                <option value="">{libelleZone(zone)} · choisir le quartier</option>
                {zone.quartiers.map((q) => <option key={q} value={q}>{libelleZone(zone)} · {q}</option>)}
              </select>
              <span className="tag">AUTO</span>
            </label>
          ) : (
            <p className="erreur">Cette position n'est pas encore couverte par Nda (Libreville 1er, Owendo, Akanda pour l'instant).</p>
          )}
        </div>

        <div className="rangee">
          <div className="champ">
            <label htmlFor="voie">Voie officielle</label>
            <div className="saisie">
              <select id="voie" value={voieId} onChange={(e) => setVoieId(e.target.value)} disabled={!zone}>
                <option value="">Choisir la voie</option>
                {zone?.voies.map((v) => <option key={v.id} value={v.id}>{v.type} {v.nom}</option>)}
                <option value={SANS_NOM}>Ma voie n'a pas encore de nom</option>
              </select>
            </div>
            <p className="aide">{voieId === SANS_NOM ? "Ton code Nda servira d'adresse." : "Issue du projet d'adressage de Libreville"}</p>
          </div>
          <div className="champ">
            <label htmlFor="num">N° de porte</label>
            <input id="num" className="saisie" inputMode="numeric" placeholder="45" value={numero} onChange={(e) => setNumero(e.target.value)} disabled={voieId === SANS_NOM} />
          </div>
        </div>

        <div className="champ">
          <label htmlFor="repere">Repère (facultatif)</label>
          <input id="repere" className="saisie" placeholder="Portail noir, face au cactus" value={repere} onChange={(e) => setRepere(e.target.value)} maxLength={120} />
        </div>

        <div className="vocal">
          <button type="button" onClick={basculerVocal}>
            {enregistre ? "⏹  Arrêter l'enregistrement" : vocal ? "🎙  Refaire la consigne vocale" : "🎙  Ajouter une consigne vocale (français, fang, punu…)"}
          </button>
          {vocal && !enregistre ? <audio controls src={vocal} /> : <p>Le livreur l'écoute en arrivant. 30 s max.</p>}
        </div>

        {erreur && <p className="erreur" role="alert">{erreur}</p>}
      </form>

      <div className="pied">
        <Bouton bloc onClick={valider} disabled={!zone || enregistre}>Continuer</Bouton>
      </div>
    </div>
  );
}
