// Drapeaux simplifiés des pays de destination (SVG en ligne, sans image externe ni emoji).
const ETOILE = "M0,-1 L0.2245,-0.309 L0.951,-0.309 L0.363,0.118 L0.588,0.809 L0,0.382 L-0.588,0.809 L-0.363,0.118 L-0.951,-0.309 L-0.2245,-0.309 Z";
const etoile = (x: number, y: number, r: number, fill: string, contour = false) =>
  <path d={ETOILE} transform={`translate(${x} ${y}) scale(${r})`} fill={contour ? "none" : fill} stroke={contour ? fill : undefined} strokeWidth={contour ? 0.16 : undefined} strokeLinejoin="round" />;
const vertical = (c: string[]) => c.map((x, i) => <rect key={i} x={(30 / c.length) * i} y={0} width={30 / c.length + 0.1} height={20} fill={x} />);
const horizontal = (c: string[]) => c.map((x, i) => <rect key={i} x={0} y={(20 / c.length) * i} width={30} height={20 / c.length + 0.1} fill={x} />);

const DESSINS: Record<string, JSX.Element> = {
  MA: <><rect width={30} height={20} fill="#c1272d" />{etoile(15, 10.4, 5, "#006233", true)}</>,
  SN: <>{vertical(["#00853f", "#fdef42", "#e31b23"])}{etoile(15, 10.3, 2.8, "#00853f")}</>,
  CI: <>{vertical(["#f77f00", "#ffffff", "#009e60"])}</>,
  TN: <><rect width={30} height={20} fill="#e70013" /><circle cx={15} cy={10} r={5} fill="#fff" /><circle cx={15.6} cy={10} r={3.6} fill="#e70013" /><circle cx={16.6} cy={10} r={2.9} fill="#fff" />{etoile(16.4, 10.2, 1.6, "#e70013")}</>,
  CM: <>{vertical(["#007a5e", "#ce1126", "#fcd116"])}{etoile(15, 10.3, 2.6, "#fcd116")}</>,
  BJ: <><rect width={30} height={10} fill="#fcd116" /><rect y={10} width={30} height={10} fill="#e8112d" /><rect width={12} height={20} fill="#008751" /></>,
  TG: <>{horizontal(["#006a4e", "#ffce00", "#006a4e", "#ffce00", "#006a4e"])}<rect width={12} height={12} fill="#d21034" />{etoile(6, 6.3, 3.4, "#fff")}</>,
  GA: <>{horizontal(["#009e60", "#fcd116", "#3a75c4"])}</>,
  RW: <><rect width={30} height={10} fill="#00a1de" /><rect y={10} width={30} height={5} fill="#fad201" /><rect y={15} width={30} height={5} fill="#20603d" /><circle cx={24} cy={4.6} r={2.4} fill="#e5be01" /></>,
  KE: <>{horizontal(["#000", "#fff", "#bb0000", "#bb0000", "#fff", "#006600"])}<ellipse cx={15} cy={10} rx={2.6} ry={6} fill="#bb0000" stroke="#000" strokeWidth={0.6} /></>,
  ZA: <><rect width={30} height={10} fill="#e03c31" /><rect y={10} width={30} height={10} fill="#001489" /><path d="M0,0 L10,10 L0,20 Z" fill="#fff" /><path d="M0,1.8 L8,10 L0,18.2 Z" fill="#ffb81c" /><path d="M0,3.3 L6.6,10 L0,16.7 Z" fill="#000" /><path d="M10,10 L30,7 L30,13 Z" fill="#fff" /><rect x={7} y={8} width={23} height={4} fill="#007749" /></>,
};

/** Drapeau simplifié d'un pays de destination ; `taille` = hauteur en pixels (proportions 3:2). */
export function Drapeau({ code, taille = 20, className = "" }: { code: string; taille?: number; className?: string }) {
  const d = DESSINS[code];
  if (!d) return null;
  return (
    <svg viewBox="0 0 30 20" width={taille * 1.5} height={taille} className={`shrink-0 overflow-hidden rounded-[4px] shadow-[0_0_0_1px_rgba(11,21,51,.08)] ${className}`} aria-hidden>
      {d}
    </svg>
  );
}
