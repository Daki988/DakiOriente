import { Icone, LOGO_MINISTERE } from '@casier/design-system';

/** Motif de QR code purement illustratif (déterministe), sans aucune donnée encodée. */
function QrIllustratif() {
  const n = 21;
  const cellules: [number, number][] = [];
  let graine = 7;
  const repere = (x: number, y: number) =>
    (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      graine = (graine * 1103515245 + 12345) & 0x7fffffff;
      if (!repere(x, y) && graine % 3 === 0) cellules.push([x, y]);
    }
  }
  const carre = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width="7" height="7" fill="#0F1D36" />
      <rect x={x + 1} y={y + 1} width="5" height="5" fill="#fff" />
      <rect x={x + 2} y={y + 2} width="3" height="3" fill="#0F1D36" />
    </g>
  );
  return (
    <svg className="p-specimen__qr" viewBox={`0 0 ${n} ${n}`} shapeRendering="crispEdges" aria-hidden="true">
      <rect width={n} height={n} fill="#fff" />
      {cellules.map(([x, y]) => <rect key={`${x}:${y}`} x={x} y={y} width="1" height="1" fill="#0F1D36" />)}
      {carre(0, 0)}{carre(n - 7, 0)}{carre(0, n - 7)}
    </svg>
  );
}

/** Illustration d'un bulletin n°3 « néant » portant la mention SPÉCIMEN (BUL-05). Aucune donnée réelle. */
export function BulletinSpecimen() {
  return (
    <figure className="p-specimen" aria-label="Illustration : bulletin n°3 spécimen, scellé et vérifiable par QR code">
      <span className="p-specimen__filigrane" aria-hidden="true" data-texte="SPÉCIMEN" />
      <div className="p-specimen__entete">
        <p>République gabonaise<span>Ministère de la Justice, Garde des Sceaux, chargé des Droits humains · Casier judiciaire national</span></p>
        <img src={LOGO_MINISTERE} alt="" width={51} height={34} style={{ borderRadius: 2 }} />
      </div>
      <p className="p-specimen__titre">Bulletin n°3</p>
      <p className="p-specimen__sous-titre">Extrait du casier judiciaire · N° B3-2026-0000412</p>
      <div className="p-specimen__lignes" aria-hidden="true">
        <div className="p-specimen__ligne"><span>Nom</span><span className="p-specimen__barre" style={{ width: '62%' }} /></div>
        <div className="p-specimen__ligne"><span>Prénoms</span><span className="p-specimen__barre" style={{ width: '48%' }} /></div>
        <div className="p-specimen__ligne"><span>Né(e) le</span><span className="p-specimen__barre" style={{ width: '34%' }} /></div>
        <div className="p-specimen__ligne"><span>État du casier au</span><span className="p-specimen__barre" style={{ width: '56%' }} /></div>
      </div>
      <p className="p-specimen__neant">NÉANT</p>
      <div className="p-specimen__pied">
        <p>
          Code de vérification<br /><strong>DEMO-VALI-DE26</strong><br />
          <span className="p-specimen__sceau"><Icone nom="badge-check" taille={14} />Sceau électronique</span>
        </p>
        <QrIllustratif />
      </div>
    </figure>
  );
}
