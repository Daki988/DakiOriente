/** Point (x, y) en pixels de la photo. */
export type Pt = [number, number];
/** Quadrilatère cible : coins haut-gauche, haut-droit, bas-droit, bas-gauche. */
export type Quad = [Pt, Pt, Pt, Pt];

/** Résout un système linéaire 8 × 8 (élimination de Gauss avec pivot partiel). */
function solve(a: number[][], b: number[]): number[] {
  const n = b.length;
  const m = a.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(m[r][c]) > Math.abs(m[p][c])) p = r;
    [m[c], m[p]] = [m[p], m[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = m[r][c] / m[c][c];
      for (let k = c; k <= n; k++) m[r][k] -= f * m[c][k];
    }
  }
  return m.map((row, i) => row[n] / row[i]);
}

/**
 * Homographie qui envoie le rectangle (0,0)–(w,h) sur le quadrilatère `q`.
 * Renvoie les 8 coefficients [a b c d e f g h] : x' = (ax+by+c)/(gx+hy+1), y' = (dx+ey+f)/(gx+hy+1).
 */
export function homography(w: number, h: number, q: Quad): number[] {
  const src: Pt[] = [[0, 0], [w, 0], [w, h], [0, h]];
  const A: number[][] = [], B: number[] = [];
  src.forEach(([x, y], i) => {
    const [X, Y] = q[i];
    A.push([x, y, 1, 0, 0, 0, -x * X, -y * X]); B.push(X);
    A.push([0, 0, 0, x, y, 1, -x * Y, -y * Y]); B.push(Y);
  });
  return solve(A, B);
}

/** Applique l'homographie à un point (utile pour les tests). */
export function project(hm: number[], [x, y]: Pt): Pt {
  const [a, b, c, d, e, f, g, h] = hm;
  const z = g * x + h * y + 1;
  return [(a * x + b * y + c) / z, (d * x + e * y + f) / z];
}

/** Transformation CSS `matrix3d` équivalente (origine en haut à gauche de l'élément). */
export function matrix3d(w: number, h: number, q: Quad): string {
  const [a, b, c, d, e, f, g, hh] = homography(w, h, q);
  // Colonnes de la matrice 4×4 (CSS est en ordre colonne) : z est laissé intact.
  const m = [a, d, 0, g, b, e, 0, hh, 0, 0, 1, 0, c, f, 0, 1];
  return `matrix3d(${m.map((v) => +v.toFixed(10)).join(",")})`;
}
