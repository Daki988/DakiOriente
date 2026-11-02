// Grille de circulation (vue de dessus) : sert à marcher sans traverser
// murs et mobilier, à calculer les trajets (A*) et la visibilité entre
// points de vue (hotspots).

export class WalkGrid {
  constructor({ x0 = -10, z0 = -4, x1 = 28, z1 = 22, res = 0.1 } = {}) {
    Object.assign(this, { x0, z0, x1, z1, res });
    this.w = Math.ceil((x1 - x0) / res);
    this.h = Math.ceil((z1 - z0) / res);
    this.raw = new Uint8Array(this.w * this.h);
    this.block = null;
  }
  ix(x) { return Math.floor((x - this.x0) / this.res); }
  iz(z) { return Math.floor((z - this.z0) / this.res); }
  cx(i) { return this.x0 + (i + 0.5) * this.res; }
  cz(j) { return this.z0 + (j + 0.5) * this.res; }

  // Rectangle infranchissable (coordonnées plan)
  addRect(ax, az, bx, bz) {
    const i0 = Math.max(0, this.ix(Math.min(ax, bx))), i1 = Math.min(this.w - 1, this.ix(Math.max(ax, bx) - 1e-6));
    const j0 = Math.max(0, this.iz(Math.min(az, bz))), j1 = Math.min(this.h - 1, this.iz(Math.max(az, bz) - 1e-6));
    for (let j = j0; j <= j1; j++) this.raw.fill(1, j * this.w + i0, j * this.w + i1 + 1);
  }

  // Dilate les obstacles du rayon du visiteur
  finalize(radius = 0.28) {
    const r = Math.ceil(radius / this.res), { w, h } = this;
    const out = new Uint8Array(w * h);
    const offs = [];
    for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) if (di * di + dj * dj <= r * r) offs.push([di, dj]);
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        if (!this.raw[j * w + i]) continue;
        for (const [di, dj] of offs) {
          const a = i + di, b = j + dj;
          if (a >= 0 && b >= 0 && a < w && b < h) out[b * w + a] = 1;
        }
      }
    for (let i = 0; i < w; i++) out[i] = out[(h - 1) * w + i] = 1;
    for (let j = 0; j < h; j++) out[j * w] = out[j * w + w - 1] = 1;
    this.block = out;
  }

  free(x, z) {
    const i = this.ix(x), j = this.iz(z);
    if (i < 0 || j < 0 || i >= this.w || j >= this.h) return false;
    return !this.block[j * this.w + i];
  }

  // Cellule libre la plus proche (recherche en anneaux)
  nearestFree(x, z, maxR = 3) {
    if (this.free(x, z)) return [x, z];
    const i0 = this.ix(x), j0 = this.iz(z), R = Math.ceil(maxR / this.res);
    for (let r = 1; r <= R; r++) {
      let best = null, bd = Infinity;
      for (let dj = -r; dj <= r; dj++)
        for (let di = -r; di <= r; di++) {
          if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
          const i = i0 + di, j = j0 + dj;
          if (i < 0 || j < 0 || i >= this.w || j >= this.h || this.block[j * this.w + i]) continue;
          const d = di * di + dj * dj;
          if (d < bd) [bd, best] = [d, [this.cx(i), this.cz(j)]];
        }
      if (best) return best;
    }
    return null;
  }

  // Ligne libre entre deux points
  los(ax, az, bx, bz) {
    const d = Math.hypot(bx - ax, bz - az), n = Math.ceil(d / (this.res * 0.5));
    for (let k = 0; k <= n; k++) {
      const t = k / Math.max(1, n);
      if (!this.free(ax + (bx - ax) * t, az + (bz - az) * t)) return false;
    }
    return true;
  }

  // Ligne libre sur la grille brute (sans marge du visiteur)
  losRaw(ax, az, bx, bz) {
    const d = Math.hypot(bx - ax, bz - az), n = Math.ceil(d / (this.res * 0.5));
    for (let k = 0; k <= n; k++) {
      const t = k / Math.max(1, n);
      const i = this.ix(ax + (bx - ax) * t), j = this.iz(az + (bz - az) * t);
      if (i < 0 || j < 0 || i >= this.w || j >= this.h || this.raw[j * this.w + i]) return false;
    }
    return true;
  }

  // A* 8-connexe puis lissage par visibilité. Renvoie [[x,z],…] ou null.
  path(ax, az, bx, bz) {
    const s = this.nearestFree(ax, az, 1), g = this.nearestFree(bx, bz, 3);
    if (!s || !g) return null;
    if (this.los(s[0], s[1], g[0], g[1])) return [s, g];
    const { w, h } = this, N = w * h;
    const si = this.iz(s[1]) * w + this.ix(s[0]), gi = this.iz(g[1]) * w + this.ix(g[0]);
    const gx = gi % w, gz = (gi / w) | 0;
    const cost = new Float32Array(N).fill(Infinity), from = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
    const heap = new Heap();
    const hfn = (k) => { const dx = Math.abs((k % w) - gx), dz = Math.abs(((k / w) | 0) - gz); return Math.max(dx, dz) + 0.414 * Math.min(dx, dz); };
    cost[si] = 0;
    heap.push(si, hfn(si));
    const nb = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
    let found = false;
    while (heap.size) {
      const k = heap.pop();
      if (k === gi) { found = true; break; }
      if (closed[k]) continue;
      closed[k] = 1;
      const i = k % w, j = (k / w) | 0;
      for (const [di, dj, c] of nb) {
        const a = i + di, b = j + dj;
        if (a < 0 || b < 0 || a >= w || b >= h) continue;
        const q = b * w + a;
        if (this.block[q] || closed[q]) continue;
        if (di && dj && (this.block[j * w + a] || this.block[b * w + i])) continue;
        const nc = cost[k] + c;
        if (nc < cost[q]) { cost[q] = nc; from[q] = k; heap.push(q, nc + hfn(q)); }
      }
    }
    if (!found) return null;
    const raw = [];
    for (let k = gi; k !== -1; k = from[k]) raw.push([this.cx(k % w), this.cz((k / w) | 0)]);
    raw.reverse();
    raw[0] = s;
    raw[raw.length - 1] = g;
    // lissage : on garde les points qui cassent la visibilité
    const out = [raw[0]];
    let cur = 0;
    while (cur < raw.length - 1) {
      let nxt = raw.length - 1;
      while (nxt > cur + 1 && !this.los(raw[cur][0], raw[cur][1], raw[nxt][0], raw[nxt][1])) nxt--;
      out.push(raw[nxt]);
      cur = nxt;
    }
    return out;
  }
}

class Heap {
  constructor() { this.k = []; this.p = []; }
  get size() { return this.k.length; }
  push(k, p) {
    const K = this.k, P = this.p;
    let i = K.length;
    K.push(k); P.push(p);
    while (i > 0) {
      const u = (i - 1) >> 1;
      if (P[u] <= p) break;
      K[i] = K[u]; P[i] = P[u]; i = u;
    }
    K[i] = k; P[i] = p;
  }
  pop() {
    const K = this.k, P = this.p, top = K[0], lk = K.pop(), lp = P.pop();
    if (K.length) {
      let i = 0;
      for (;;) {
        let c = 2 * i + 1;
        if (c >= K.length) break;
        if (c + 1 < K.length && P[c + 1] < P[c]) c++;
        if (P[c] >= lp) break;
        K[i] = K[c]; P[i] = P[c]; i = c;
      }
      K[i] = lk; P[i] = lp;
    }
    return top;
  }
}
