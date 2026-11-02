// Construction du modèle 3D DAILY HUB à partir du plan coté (plan.js).
// Un seul modèle sert à la visite, aux 33 rendus et au film.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { BUILDING, X, ZONES, OPENINGS, PARTITIONS, SITE } from './plan.js';
import * as TX from './textures.js';

const { length: L, depth: D, height: H, wall: W } = BUILDING;

// ---------------------------------------------------------------- matériaux
function makeMaterials() {
  const std = (o) => new THREE.MeshStandardMaterial(o);
  const rep = (t, x, y) => {
    t.repeat.set(x, y);
    return t;
  };
  return {
    wall: std({ color: TX.PALETTE.wall, roughness: 0.9 }),
    forest: std({ color: TX.PALETTE.forest, roughness: 0.8 }),
    forestDark: std({ color: TX.PALETTE.forestDark, roughness: 0.8 }),
    metal: std({ color: TX.PALETTE.metal, roughness: 0.45, metalness: 0.6 }),
    steel: std({ color: '#c9ccd0', roughness: 0.3, metalness: 0.85 }),
    chrome: std({ color: '#e8e8e8', roughness: 0.15, metalness: 1 }),
    white: std({ color: '#f6f6f4', roughness: 0.5 }),
    wood: std({ map: TX.woodTexture(), roughness: 0.65 }),
    woodLight: std({ map: TX.woodTexture(TX.PALETTE.woodLight), roughness: 0.6 }),
    ceiling: std({ color: '#202322', roughness: 0.95 }),
    floorTile: std({ map: rep(TX.tileTexture('#cbc3b5', '#a89e8f'), 1, 1), roughness: 0.35 }),
    floorTileCool: std({ map: rep(TX.tileTexture('#c4c8c8', '#9da3a4'), 1, 1), roughness: 0.35 }),
    floorTileDark: std({ map: rep(TX.tileTexture('#5b5f5e', '#3f4241'), 1, 1), roughness: 0.4 }),
    floorWood: std({ map: TX.woodFloorTexture(), roughness: 0.55 }),
    concrete: std({ map: TX.concreteTexture(), roughness: 0.9 }),
    asphalt: std({ map: TX.asphaltTexture(), roughness: 0.95 }),
    grass: std({ map: TX.grassTexture(), roughness: 1 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: '#cfe3e6', roughness: 0.05, metalness: 0, transparent: true, opacity: 0.18,
      envMapIntensity: 1.5, depthWrite: false, side: THREE.DoubleSide,
    }),
    darkGlass: std({ color: '#1a2226', roughness: 0.1, metalness: 0.4 }),
    ledWarm: std({ color: '#ffe3b8', emissive: '#ffcf8a', emissiveIntensity: 2.2 }),
    ledCool: std({ color: '#ffffff', emissive: '#f4f7ff', emissiveIntensity: 2.0 }),
    fridgeLight: std({ color: '#ffffff', emissive: '#eaf6ff', emissiveIntensity: 1.2 }),
    leaf: std({ color: '#ffffff', roughness: 0.7 }),
    pot: std({ color: '#2b2b2b', roughness: 0.6 }),
    potLight: std({ color: '#d8d3c8', roughness: 0.8 }),
    fabric: std({ color: '#2d5e44', roughness: 0.95 }),
    fabricBeige: std({ color: '#cbb89c', roughness: 0.95 }),
    cardboard: std({ color: '#b48a5a', roughness: 0.9 }),
    blueTank: std({ color: '#1f56b8', roughness: 0.4 }),
    porcelain: std({ color: '#fbfbfb', roughness: 0.15 }),
    mirror: std({ color: '#d9e1e4', roughness: 0.02, metalness: 1 }),
    linen: std({ color: '#f3f1ec', roughness: 1 }),
    car1: std({ color: '#d7d9db', roughness: 0.3, metalness: 0.5 }),
    car2: std({ color: '#4a5560', roughness: 0.3, metalness: 0.5 }),
    tire: std({ color: '#151515', roughness: 0.9 }),
    lineWhite: std({ color: '#f2f2f2', roughness: 0.7 }),
    lineYellow: std({ color: '#f2c94c', roughness: 0.7, emissive: '#3a2a00' }),
    wallTile: std({ map: rep(TX.tileTexture('#2c5a43', '#1d3d2d'), 6, 3), roughness: 0.25 }),
    wallTileLight: std({ map: rep(TX.tileTexture('#e9e6df', '#c8c3b8'), 6, 3), roughness: 0.25 }),
    instance: std({ color: '#ffffff', roughness: 0.55 }),
  };
}

// ------------------------------------------------------------------- helpers
// Emprises au sol des obstacles (pour la grille de circulation)
let COLLIDE = null;
const _b = new THREE.Box3();
function reg(mesh) {
  if (!COLLIDE) return;
  _b.setFromObject(mesh);
  if (_b.max.y > 0.15 && _b.min.y < 1.7) COLLIDE.push([_b.min.x, _b.min.z, _b.max.x, _b.max.z]);
}
// Bloc défini par ses coins min/max (coordonnées du plan).
function blk(parent, mat, x0, y0, z0, x1, y1, z1, { cast = true, receive = true, name, walk = true } = {}) {
  const g = new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0));
  const m = new THREE.Mesh(g, mat);
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  m.castShadow = cast;
  m.receiveShadow = receive;
  if (name) m.name = name;
  parent.add(m);
  if (walk) reg(m);
  return m;
}

function cyl(parent, mat, r, h, x, y, z, { seg = 20, axis = 'y', rTop } = {}) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop ?? r, r, h, seg), mat);
  m.position.set(x, y, z);
  if (axis === 'z') m.rotation.x = Math.PI / 2;
  if (axis === 'x') m.rotation.z = Math.PI / 2;
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  reg(m);
  return m;
}

// Groupe local orienté : +Z local = côté client.
function placed(parent, x, z, rotY = 0, y = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  parent.add(g);
  g.updateMatrixWorld(true);
  return g;
}
const FACE = { south: 0, north: Math.PI, east: Math.PI / 2, west: -Math.PI / 2 };

function plane(parent, mat, w, h, x, y, z, rotY = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.position.set(x, y, z);
  m.rotation.y = rotY;
  parent.add(m);
  return m;
}

// --------------------------------------------------- objets instanciés (perf)
class Instancer {
  constructor() {
    this.items = { box: [], bottle: [], sphere: [], leaf: [] };
  }
  add(kind, parent, x, y, z, sx, sy, sz, color, rot = 0) {
    parent.updateMatrixWorld(true);
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(x, y, z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rot, 0)),
      new THREE.Vector3(sx, sy, sz),
    );
    m.premultiply(parent.matrixWorld);
    this.items[kind].push([m, new THREE.Color(color)]);
  }
  build(root, mats) {
    const geos = {
      box: new THREE.BoxGeometry(1, 1, 1),
      bottle: new THREE.CylinderGeometry(0.5, 0.5, 1, 8),
      sphere: new THREE.IcosahedronGeometry(0.5, 1),
      leaf: new THREE.IcosahedronGeometry(0.5, 0),
    };
    for (const [k, list] of Object.entries(this.items)) {
      if (!list.length) continue;
      const mat = k === 'leaf' ? mats.leaf : mats.instance;
      const im = new THREE.InstancedMesh(geos[k], mat, list.length);
      list.forEach(([m, c], i) => {
        im.setMatrixAt(i, m);
        im.setColorAt(i, c);
      });
      im.castShadow = k === 'leaf';
      im.receiveShadow = true;
      im.name = `instances-${k}`;
      root.add(im);
    }
  }
}

const PRODUCT_COLORS = {
  epicerie: ['#e8452c', '#f2b632', '#2f8f4e', '#2b6cb0', '#f07c22', '#c0392b', '#f4d03f', '#8e5a2b', '#ffffff'],
  hygiene: ['#4aa3df', '#ffffff', '#e86fa6', '#6bd0c4', '#9b59b6', '#f5f5f5', '#3d7fd8', '#a3e4d7'],
  boissons: ['#d62828', '#f77f00', '#fcbf49', '#2a9d8f', '#e9ecef', '#264653', '#90be6d', '#7b2cbf'],
  frais: ['#f1faee', '#ffd166', '#ef476f', '#06d6a0', '#e9c46a', '#f4a261'],
  lessive: ['#1e88e5', '#43a047', '#fdd835', '#e53935', '#8e24aa', '#ffffff'],
  carton: ['#b48a5a', '#a67c52', '#c49a6c', '#9c7146'],
};
const pick = (arr, i) => arr[(i * 7 + (i >> 2)) % arr.length];

// ================================================================ construction
export function buildDailyHub() {
  const M = makeMaterials();
  COLLIDE = [];
  const root = new THREE.Group();
  root.name = 'DAILY_HUB';
  const groups = {
    static: new THREE.Group(),
    ceiling: new THREE.Group(),
    roof: new THREE.Group(),
    glass: new THREE.Group(),
    lights: new THREE.Group(),
    exterior: new THREE.Group(),
    signs: new THREE.Group(),
  };
  for (const [k, g] of Object.entries(groups)) {
    g.name = k;
    root.add(g);
  }
  const S = groups.static;
  const I = new Instancer();
  const emissives = []; // matériaux à pousser la nuit
  const pointLights = [];

  // ---------------------------------------------------------------- sols
  const floorMat = { tile: M.floorTile, tileCool: M.floorTileCool, tileDark: M.floorTileDark, wood: M.floorWood, concrete: M.concrete };
  for (const z of ZONES) {
    const w = z.x1 - z.x0, d = z.z1 - z.z0;
    const mat = floorMat[z.floor].clone();
    const per = z.floor === 'wood' ? 1.44 : z.floor === 'concrete' ? 2 : 1.2;
    mat.map = mat.map.clone();
    mat.map.repeat.set(w / per, d / per);
    mat.map.needsUpdate = true;
    const f = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    f.rotation.x = -Math.PI / 2;
    f.position.set((z.x0 + z.x1) / 2, 0.001, (z.z0 + z.z1) / 2);
    f.receiveShadow = true;
    f.name = `sol-${z.id}`;
    S.add(f);
  }

  // ------------------------------------------------------- murs extérieurs
  // matériaux par face de boîte : [+x, -x, +y, -y, +z, -z]
  const extClad = M.metal;
  const sideDefs = {
    west: { len: D, at: (a, b) => [-W, a, 0, b], outer: 1, inner: M.wall },
    east: { len: D, at: (a, b) => [L, a, L + W, b], outer: 0, inner: M.concrete },
    north: { len: L, at: (a, b) => [a, -W, b, 0], outer: 5, inner: M.forest },
    south: { len: L, at: (a, b) => [a, D, b, D + W], outer: 4, inner: M.metal },
  };
  const wallBox = (side, a, b, y0, y1, innerMat) => {
    const def = sideDefs[side];
    const [x0, z0, x1, z1] = side === 'west' || side === 'east'
      ? [def.at(a, b)[0], def.at(a, b)[1], def.at(a, b)[2], def.at(a, b)[3]]
      : def.at(a, b);
    // ouest/est : a,b sont des Z ; nord/sud : des X
    let bx0, bz0, bx1, bz1;
    if (side === 'west' || side === 'east') [bx0, bz0, bx1, bz1] = [x0, a, x1, b];
    else [bx0, bz0, bx1, bz1] = [a, z0, b, z1];
    const mats = Array(6).fill(innerMat);
    mats[2] = mats[3] = M.metal;
    mats[def.outer] = extClad;
    const g = new THREE.BoxGeometry(bx1 - bx0, y1 - y0, bz1 - bz0);
    const m = new THREE.Mesh(g, mats);
    m.position.set((bx0 + bx1) / 2, (y0 + y1) / 2, (bz0 + bz1) / 2);
    m.castShadow = m.receiveShadow = true;
    S.add(m);
    reg(m);
  };
  const innerFor = (side, a, b) => {
    const mid = (a + b) / 2;
    if (side === 'south') return mid > X.back ? M.wall : M.metal;
    if (side !== 'north') return sideDefs[side].inner;
    return mid > X.back ? M.concrete : M.forest;
  };

  for (const side of Object.keys(sideDefs)) {
    const ops = OPENINGS.filter((o) => o.side === side).sort((p, q) => p.from - q.from);
    const len = side === 'west' || side === 'east' ? D : L;
    const ext0 = side === 'west' || side === 'east' ? -W : -W; // coins
    let cur = side === 'north' || side === 'south' ? -W : 0;
    const end = side === 'north' || side === 'south' ? len + W : len;
    for (const o of ops) {
      if (o.from > cur) wallBox(side, cur, o.from, 0, H + 0.9, innerFor(side, cur, o.from));
      const top = o.type === 'door' ? 2.5 : 2.9;
      const sill = o.type === 'door' ? 0 : o.sill ?? 0.15;
      wallBox(side, o.from, o.to, top, H + 0.9, innerFor(side, o.from, o.to)); // linteau + acrotère
      if (sill > 0) wallBox(side, o.from, o.to, 0, sill, innerFor(side, o.from, o.to));
      addGlazing(side, o, sill, top);
      cur = o.to;
    }
    if (cur < end) wallBox(side, cur, end, 0, H + 0.9, innerFor(side, cur, end));
    void ext0;
  }

  function addGlazing(side, o, y0, y1) {
    const t = 0.05;
    const n = Math.max(1, Math.round((o.to - o.from) / 1.2));
    const step = (o.to - o.from) / n;
    const vert = side === 'west' || side === 'east';
    const c = side === 'west' ? -W / 2 : side === 'east' ? L + W / 2 : side === 'north' ? -W / 2 : D + W / 2;
    // vitrage
    if (vert) {
      const p = plane(groups.glass, M.glass, o.to - o.from, y1 - y0, c, (y0 + y1) / 2, (o.from + o.to) / 2, Math.PI / 2);
      p.renderOrder = 2;
    } else {
      const p = plane(groups.glass, M.glass, o.to - o.from, y1 - y0, (o.from + o.to) / 2, (y0 + y1) / 2, c);
      p.renderOrder = 2;
    }
    if (o.type !== 'door') {
      if (vert) COLLIDE.push([c - 0.05, o.from, c + 0.05, o.to]);
      else COLLIDE.push([o.from, c - 0.05, o.to, c + 0.05]);
    }
    // menuiseries métal noir
    const walk = o.type !== 'door';
    const frame = (a, b, ya, yb) => {
      if (vert) blk(S, M.metal, c - t, ya, a, c + t, yb, b, { walk });
      else blk(S, M.metal, a, ya, c - t, b, yb, c + t, { walk });
    };
    frame(o.from, o.from + t, y0, y1);
    frame(o.to - t, o.to, y0, y1);
    frame(o.from, o.to, y1 - t, y1);
    frame(o.from, o.to, y0, y0 + t);
    if (o.type !== 'door') for (let i = 1; i < n; i++) frame(o.from + i * step - t / 2, o.from + i * step + t / 2, y0, y1);
    else {
      const mid = (o.from + o.to) / 2;
      frame(mid - t / 2, mid + t / 2, y0, y1);
      // poignées
      const hz = vert ? null : null;
      void hz;
      if (vert) {
        blk(S, M.chrome, c - 0.09, 0.9, mid - 0.08, c + 0.09, 1.5, mid - 0.06, { walk: false });
        blk(S, M.chrome, c - 0.09, 0.9, mid + 0.06, c + 0.09, 1.5, mid + 0.08, { walk: false });
      } else {
        blk(S, M.chrome, mid - 0.08, 0.9, c - 0.09, mid - 0.06, 1.5, c + 0.09, { walk: false });
        blk(S, M.chrome, mid + 0.06, 0.9, c - 0.09, mid + 0.08, 1.5, c + 0.09, { walk: false });
      }
    }
  }

  // ----------------------------------------------------- cloisons intérieures
  for (const p of PARTITIONS) {
    const [ax, az] = p.a, [bx, bz] = p.b;
    const alongX = az === bz;
    const len = alongX ? bx - ax : bz - az;
    const t = BUILDING.partition / 2;
    const seg = (s0, s1, y0, y1, mat) => {
      if (s1 - s0 < 0.01) return;
      if (alongX) blk(S, mat, ax + s0, y0, az - t, ax + s1, y1, az + t);
      else blk(S, mat, ax - t, y0, az + s0, ax + t, y1, az + s1);
    };
    const ops = (p.openings || []).slice().sort((u, v) => u.from - v.from);
    let cur = 0;
    if (p.kind === 'glass') {
      // soubassement bois + vitrage + montants noirs
      const all = [];
      for (const o of ops) {
        all.push([cur, o.from]);
        cur = o.to;
      }
      all.push([cur, len]);
      for (const [s0, s1] of all) {
        seg(s0, s1, 0, 0.9, M.wood);
        seg(s0, s1, 2.5, H, M.metal);
        const mid = (s0 + s1) / 2;
        const gp = alongX
          ? plane(groups.glass, M.glass, s1 - s0, 1.6, ax + mid, 1.7, az)
          : plane(groups.glass, M.glass, s1 - s0, 1.6, ax, 1.7, az + mid, Math.PI / 2);
        gp.renderOrder = 2;
        if (alongX) COLLIDE.push([ax + s0, az - 0.05, ax + s1, az + 0.05]);
        else COLLIDE.push([ax - 0.05, az + s0, ax + 0.05, az + s1]);
        for (let s = s0; s <= s1 + 1e-6; s += (s1 - s0) / Math.max(1, Math.round((s1 - s0) / 0.9))) seg(s - 0.025, s + 0.025, 0.9, 2.5, M.metal);
      }
      for (const o of ops) seg(o.from, o.to, 2.5, H, M.metal);
    } else {
      for (const o of ops) {
        seg(cur, o.from, 0, H, M.wall);
        seg(o.from, o.to, 2.2, H, M.wall);
        // porte (vantail fermé, vert forêt) sauf passage libre
        if (o.door) {
          const dm = M.forestDark;
          if (alongX) {
            blk(S, dm, ax + o.from + 0.02, 0, az - 0.02, ax + o.to - 0.02, 2.18, az + 0.02, { walk: false });
            blk(S, M.chrome, ax + o.to - 0.18, 1.0, az - 0.06, ax + o.to - 0.1, 1.04, az + 0.06, { walk: false });
          } else {
            blk(S, dm, ax - 0.02, 0, az + o.from + 0.02, ax + 0.02, 2.18, az + o.to - 0.02, { walk: false });
            blk(S, M.chrome, ax - 0.06, 1.0, az + o.to - 0.18, ax + 0.06, 1.04, az + o.to - 0.1, { walk: false });
            // plaque de porte côté laverie
            const icon = o.door === 'Hommes' ? 'man' : o.door === 'Femmes' ? 'woman' : null;
            const tex = TX.signTexture(o.door, { icon, w: 512, h: 160 });
            const sm = new THREE.MeshStandardMaterial({ map: tex, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.25 });
            plane(groups.signs, sm, 0.62, 0.2, ax - 0.06, 2.0, az + (o.from + o.to) / 2, -Math.PI / 2);
          }
        }
        cur = o.to;
      }
      seg(cur, len, 0, H, M.wall);
    }
  }

  // --------------------------------------------------------------- plafonds
  {
    const c = new THREE.Mesh(new THREE.PlaneGeometry(L, D), M.ceiling);
    c.rotation.x = Math.PI / 2;
    c.position.set(L / 2, H, D / 2);
    c.receiveShadow = true;
    groups.ceiling.add(c);
    // toiture (vue extérieure)
    blk(groups.roof, M.metal, -W, H + 0.01, -W, L + W, H + 0.25, D + W, { cast: true });
    // tasseaux bois au plafond du café
    for (let x = X.cafe + 0.15; x < X.laverie - 0.1; x += 0.16) blk(groups.ceiling, M.wood, x, H - 0.12, 0.05, x + 0.06, H, D - 0.05, { cast: false });
    // lignes LED supérette & laverie
    for (const z of [1.2, 3.0, 4.8]) {
      blk(groups.ceiling, M.metal, 0.4, H - 0.08, z - 0.05, X.cafe - 0.3, H, z + 0.05, { cast: false });
      blk(groups.ceiling, M.ledCool, 0.4, H - 0.09, z - 0.03, X.cafe - 0.3, H - 0.08, z + 0.03, { cast: false });
    }
    for (const z of [1.5, 4.5]) {
      blk(groups.ceiling, M.metal, X.laverie + 0.4, H - 0.08, z - 0.05, X.back - 0.3, H, z + 0.05, { cast: false });
      blk(groups.ceiling, M.ledCool, X.laverie + 0.4, H - 0.09, z - 0.03, X.back - 0.3, H - 0.08, z + 0.03, { cast: false });
    }
    // spots arrière
    for (const zn of ZONES.filter((z) => z.x0 >= X.back)) {
      cyl(groups.ceiling, M.ledCool, 0.12, 0.02, (zn.x0 + zn.x1) / 2, H - 0.01, (zn.z0 + zn.z1) / 2);
    }
  }

  // ------------------------------------------------------------- éclairage
  const addPoint = (x, y, z, color = '#ffd8a8', intensity = 6, dist = 7) => {
    const l = new THREE.PointLight(color, intensity, dist, 1.6);
    l.position.set(x, y, z);
    groups.lights.add(l);
    pointLights.push(l);
    return l;
  };
  addPoint(1.6, 3.0, 3.0, '#fff1de', 9, 8);
  addPoint(4.3, 3.0, 3.0, '#fff1de', 9, 8);
  addPoint(7.0, 2.6, 3.4, '#ffc983', 8, 7);
  addPoint(9.4, 2.6, 3.4, '#ffc983', 7, 7);
  addPoint(12.6, 3.0, 3.0, '#f6f8ff', 9, 8);
  addPoint(15.2, 3.0, 3.0, '#f6f8ff', 8, 8);
  addPoint(18.3, 3.0, 1.2, '#ffffff', 3, 4);
  addPoint(18.3, 3.0, 4.8, '#ffffff', 3, 4);

  // ------------------------------------------------------------- mobilier
  // Rayonnage mural : back à z=0 local, profondeur d, façade vers +z local
  function shelving(parent, len, d, h, levels, palette, { frame = M.metal, back = M.forestDark, open = false } = {}) {
    if (!open) blk(parent, back, -len / 2, 0, 0, len / 2, h, 0.03);
    blk(parent, frame, -len / 2, 0, 0, -len / 2 + 0.04, h, d);
    blk(parent, frame, len / 2 - 0.04, 0, 0, len / 2, h, d);
    blk(parent, M.metal, -len / 2, 0, d - 0.02, len / 2, 0.12, d); // plinthe
    let k = 0;
    for (let i = 0; i < levels; i++) {
      const y = 0.12 + (i * (h - 0.2)) / levels;
      blk(parent, M.white, -len / 2 + 0.04, y, 0.03, len / 2 - 0.04, y + 0.025, d, { cast: false });
      blk(parent, M.ledWarm, -len / 2 + 0.04, y - 0.012, d - 0.03, len / 2 - 0.04, y, d - 0.01, { cast: false });
      // produits
      let x = -len / 2 + 0.08;
      const ph = Math.min(0.3, (h - 0.2) / levels - 0.06);
      while (x < len / 2 - 0.12) {
        // facings de 2 à 4 produits identiques, formats variés
        const w = 0.06 + ((k * 37) % 9) / 90;
        const hh = ph * (0.45 + ((k * 13) % 6) / 11);
        const pd = Math.min(d - 0.06, 0.1 + ((k * 11) % 5) / 30);
        const c = pick(palette, k++);
        const facings = 2 + (k % 3);
        for (let f = 0; f < facings && x < len / 2 - 0.08; f++) {
          I.add('box', parent, x + w / 2, y + 0.025 + hh / 2, d - 0.02 - pd / 2, w * 0.94, hh, pd, c);
          x += w + 0.006;
        }
        x += 0.01;
      }
    }
    return parent;
  }

  function gondola(x0, x1, z0, z1, palette, h = 1.55) {
    const len = x1 - x0, cz = (z0 + z1) / 2, half = (z1 - z0) / 2;
    const a = placed(S, (x0 + x1) / 2, cz, 0);
    const b = placed(S, (x0 + x1) / 2, cz, Math.PI);
    shelving(a, len, half, h, 4, palette, { back: M.forestDark });
    shelving(b, len, half, h, 4, palette, { back: M.forestDark });
    // têtes de gondole bois
    blk(S, M.wood, x0 - 0.05, 0, z0, x0, h + 0.05, z1);
    blk(S, M.wood, x1, 0, z0, x1 + 0.05, h + 0.05, z1);
    blk(S, M.wood, x0 - 0.05, h, z0, x1 + 0.05, h + 0.05, z1);
  }

  function fridges(parent, n, w = 0.7, d = 0.75, h = 2.1) {
    for (let i = 0; i < n; i++) {
      const x = -((n * w) / 2) + i * w;
      blk(parent, M.metal, x, 0, 0, x + w, h, 0.05);
      blk(parent, M.metal, x, 0, 0, x + 0.04, h, d);
      blk(parent, M.metal, x + w - 0.04, 0, 0, x + w, h, d);
      blk(parent, M.metal, x, h - 0.25, 0, x + w, h, d); // bandeau haut
      blk(parent, M.metal, x, 0, 0, x + w, 0.15, d);
      blk(parent, M.fridgeLight, x + 0.04, 0.15, 0.05, x + w - 0.04, h - 0.25, 0.07, { cast: false });
      blk(parent, M.chrome, x + w - 0.1, 0.8, d + 0.01, x + w - 0.08, 1.5, d + 0.04);
      for (let s = 0; s < 5; s++) {
        const y = 0.17 + s * 0.34;
        blk(parent, M.white, x + 0.04, y, 0.07, x + w - 0.04, y + 0.015, d - 0.05, { cast: false });
        for (let j = 0; j < 7; j++) {
          const c = pick(PRODUCT_COLORS.boissons, i * 40 + s * 7 + j);
          for (let r = 0; r < 3; r++) I.add('bottle', parent, x + 0.08 + j * 0.085, y + 0.015 + 0.13, d - 0.12 - r * 0.12, 0.065, 0.26, 0.065, c);
        }
      }
      const gl = plane(groups.glass, M.glass, w - 0.08, h - 0.4, 0, 0, 0);
      parent.updateMatrixWorld(true);
      gl.position.set(x + w / 2, (h - 0.1) / 2 + 0.1, d);
      gl.applyMatrix4(parent.matrixWorld);
      gl.renderOrder = 2;
    }
  }

  function crates(parent, len, d, palette, { tiers = 3 } = {}) {
    // étal en gradins bois, façade +z local
    let k = 0;
    for (let t = 0; t < tiers; t++) {
      const z0 = (t * d) / tiers, y = 0.75 + (tiers - 1 - t) * 0.25;
      blk(parent, M.wood, -len / 2, 0, z0, len / 2, y, z0 + d / tiers);
      const nb = Math.floor(len / 0.42);
      for (let i = 0; i < nb; i++) {
        const cx = -len / 2 + 0.21 + i * 0.42;
        blk(parent, M.woodLight, cx - 0.2, y, z0 + 0.02, cx + 0.2, y + 0.08, z0 + d / tiers - 0.02, { cast: false });
        const c = pick(palette, k++);
        for (let a = 0; a < 3; a++)
          for (let b = 0; b < 2; b++) I.add('sphere', parent, cx - 0.12 + a * 0.12, y + 0.12, z0 + 0.06 + b * 0.1 + ((a + b) % 2) * 0.02, 0.1, 0.1, 0.1, c);
      }
    }
  }

  function plant(x, z, s = 1, { potMat = M.pot, h = 1.0 } = {}) {
    const p = placed(S, x, z);
    cyl(p, potMat, 0.2 * s, 0.4 * s, 0, 0.2 * s, 0, { rTop: 0.24 * s });
    cyl(p, M.wood, 0.02 * s, h * s, 0, 0.4 * s + (h * s) / 2, 0, { seg: 6 });
    const greens = ['#3f7d36', '#2f6b2c', '#5a9a3c', '#356f2a', '#4c8a35'];
    const n = Math.round(14 * s);
    for (let i = 0; i < n; i++) {
      const a = i * 2.4, r = 0.12 + ((i * 7) % 5) * 0.05;
      const y = 0.45 * s + (h * s) * (0.35 + ((i * 3) % 7) / 10);
      I.add('leaf', p, Math.cos(a) * r * s, y, Math.sin(a) * r * s, 0.38 * s, 0.26 * s, 0.38 * s, pick(greens, i), a);
    }
  }

  function hangingPlant(x, z, y = H - 0.1) {
    const p = placed(S, x, z);
    for (let i = 0; i < 8; i++) I.add('leaf', p, Math.cos(i) * 0.15, y - 0.15 - (i % 4) * 0.18, Math.sin(i) * 0.15, 0.22, 0.3, 0.22, '#3f7d36', i);
  }

  function table(x, z, r = 0.35, h = 0.75, top = M.woodLight) {
    cyl(S, top, r, 0.04, x, h, z, { seg: 28 });
    cyl(S, M.metal, 0.03, h, x, h / 2, z, { seg: 8 });
    cyl(S, M.metal, 0.22, 0.02, x, 0.01, z, { seg: 16 });
  }

  function chair(x, z, rotY, mat = M.fabric) {
    const c = placed(S, x, z, rotY);
    blk(c, M.metal, -0.2, 0, -0.2, -0.18, 0.45, -0.18);
    blk(c, M.metal, 0.18, 0, -0.2, 0.2, 0.45, -0.18);
    blk(c, M.metal, -0.2, 0, 0.18, -0.18, 0.45, 0.2);
    blk(c, M.metal, 0.18, 0, 0.18, 0.2, 0.45, 0.2);
    blk(c, mat, -0.21, 0.45, -0.21, 0.21, 0.5, 0.21);
    blk(c, M.wood, -0.21, 0.5, -0.23, 0.21, 0.88, -0.19);
  }

  function stool(x, z) {
    cyl(S, M.wood, 0.17, 0.05, x, 0.75, z);
    cyl(S, M.metal, 0.025, 0.75, x, 0.37, z, { seg: 8 });
    cyl(S, M.metal, 0.18, 0.02, x, 0.3, z, { rTop: 0.18, seg: 16 });
  }

  function banquette(parent, len, mat = M.fabric) {
    blk(parent, M.wood, -len / 2, 0, 0, len / 2, 0.42, 0.55);
    blk(parent, mat, -len / 2, 0.42, 0.05, len / 2, 0.5, 0.55);
    blk(parent, mat, -len / 2, 0.5, 0, len / 2, 1.0, 0.14);
  }

  function pendant(x, z, drop = 1.2) {
    cyl(groups.ceiling, M.metal, 0.005, drop, x, H - drop / 2, z, { seg: 4 });
    const shade = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.woodLight);
    shade.position.set(x, H - drop, z);
    shade.material = M.woodLight;
    groups.ceiling.add(shade);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), M.ledWarm);
    bulb.position.set(x, H - drop - 0.04, z);
    groups.ceiling.add(bulb);
  }

  function signPanel(text, x, y, z, rotY, w, h, opts = {}) {
    const tex = TX.signTexture(text, { w: 1024, h: Math.round((1024 * h) / w), ...opts });
    const mat = new THREE.MeshStandardMaterial({ map: tex, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.35, roughness: 0.6 });
    emissives.push(mat);
    const m = plane(groups.signs, mat, w, h, x, y, z, rotY);
    m.name = `enseigne-${text}`;
    return m;
  }

  function washer(parent, x, y = 0.3, w = 0.7, h = 1.05, d = 0.8) {
    blk(parent, M.steel, x - w / 2 + 0.01, y, 0, x + w / 2 - 0.01, y + h, d);
    blk(parent, M.darkGlass, x - w / 2 + 0.06, y + h - 0.2, d, x + w / 2 - 0.06, y + h - 0.08, d + 0.01, { cast: false });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.035, 10, 32), M.chrome);
    ring.position.set(x, y + (h - 0.2) / 2, d + 0.02);
    parent.add(ring);
    const door = new THREE.Mesh(new THREE.CircleGeometry(0.2, 32), M.darkGlass);
    door.position.set(x, y + (h - 0.2) / 2, d + 0.015);
    parent.add(door);
    // linge visible
    I.add('sphere', parent, x, y + (h - 0.2) / 2 - 0.08, d - 0.2, 0.3, 0.18, 0.2, pick(['#e8e1d6', '#9ec1e0', '#d98b8b'], Math.round(x * 3)));
  }

  // ===================== SUPÉRETTE ========================================
  // Accueil (contre la vitrine ouest, face à l'entrée)
  {
    const a = placed(S, 0.55, 1.25, FACE.east);
    blk(a, M.wood, -0.7, 0, -0.25, 0.7, 1.05, 0.25);
    blk(a, M.metal, -0.75, 1.05, -0.3, 0.75, 1.09, 0.3);
    for (let i = -0.65; i < 0.7; i += 0.06) blk(a, M.woodLight, i, 0.05, 0.25, i + 0.03, 1.0, 0.28, { cast: false });
    signPanel('Accueil', 0.15, 2.45, 1.25, FACE.east, 1.2, 0.3, { icon: 'cart' });
    // borne d'orientation
    const b = placed(S, 1.25, 0.45, FACE.south);
    blk(b, M.metal, -0.06, 0, -0.06, 0.06, 1.0, 0.06);
    blk(b, M.metal, -0.28, 1.0, -0.05, 0.28, 1.45, 0.04);
    const scr = new THREE.MeshStandardMaterial({ map: TX.screenTexture('Bienvenue'), emissive: '#ffffff', emissiveMap: TX.screenTexture('Bienvenue'), emissiveIntensity: 0.8 });
    emissives.push(scr);
    const sp = plane(b, scr, 0.5, 0.38, 0, 1.225, 0.045);
    void sp;
    plant(0.4, 0.35, 1.1, { potMat: M.potLight });
  }
  // Mur arrière : épicerie + boissons
  shelving(placed(S, 2.0, 0, FACE.south), 1.6, 0.45, 2.2, 5, PRODUCT_COLORS.epicerie);
  signPanel('Épicerie', 2.0, 2.75, 0.02, 0, 1.6, 0.4, { icon: 'basket' });
  fridges(placed(S, 4.25, 0, FACE.south), 4);
  signPanel('Boissons', 4.25, 2.75, 0.02, 0, 2.6, 0.45);
  // Gondoles centrales (allée centrale z 2,35 → 3,45)
  gondola(2.2, 3.9, 1.75, 2.35, PRODUCT_COLORS.epicerie);
  gondola(4.3, 5.2, 1.75, 2.35, PRODUCT_COLORS.epicerie);
  gondola(2.2, 3.9, 3.45, 4.05, PRODUCT_COLORS.hygiene);
  gondola(4.3, 5.2, 3.45, 4.05, PRODUCT_COLORS.hygiene);
  signPanel('Hygiène & entretien', 3.05, 2.3, 3.75, 0, 1.6, 0.26);
  signPanel('Hygiène & entretien', 3.05, 2.3, 3.75, Math.PI, 1.6, 0.26);
  for (const gx of [3.05, 4.75]) {
    cyl(groups.ceiling, M.metal, 0.004, 1.1, gx, H - 0.55, 3.75, { seg: 4 });
    cyl(groups.ceiling, M.metal, 0.004, 1.1, gx, H - 0.55, 2.05, { seg: 4 });
  }
  signPanel('Épicerie', 3.05, 2.3, 2.05, 0, 1.6, 0.26);
  signPanel('Épicerie', 3.05, 2.3, 2.05, Math.PI, 1.6, 0.26);
  // Façade sud : fruits & légumes + produits frais
  crates(placed(S, 2.95, 6, FACE.north), 1.9, 0.9, ['#e63946', '#f4a261', '#90be6d', '#ffd166', '#43aa8b', '#f94144', '#f8961e']);
  signPanel('Fruits & légumes', 2.95, 2.05, 5.9, Math.PI, 1.9, 0.38);
  {
    const f = placed(S, 4.85, 6, FACE.north);
    blk(f, M.metal, -0.85, 0, 0, 0.85, 0.85, 0.85);
    blk(f, M.fridgeLight, -0.8, 0.85, 0.05, 0.8, 0.87, 0.8, { cast: false });
    shelving(f, 1.7, 0.4, 2.1, 4, PRODUCT_COLORS.frais, { back: M.forestDark });
    for (let i = 0; i < 18; i++) I.add('box', f, -0.75 + (i % 9) * 0.18, 0.92, 0.35 + Math.floor(i / 9) * 0.25, 0.15, 0.07, 0.2, pick(PRODUCT_COLORS.frais, i));
    signPanel('Produits frais', 4.85, 2.4, 5.94, Math.PI, 1.7, 0.36);
  }
  // Caisse (côté ouest, après l'entrée)
  {
    const c = placed(S, 0.95, 4.75, FACE.east);
    blk(c, M.wood, -0.7, 0, -0.28, 0.7, 0.95, 0.28);
    blk(c, M.metal, -0.75, 0.95, -0.32, 0.75, 0.99, 0.32);
    for (let i = -0.65; i < 0.7; i += 0.06) blk(c, M.woodLight, i, 0.05, 0.28, i + 0.03, 0.9, 0.31, { cast: false });
    blk(c, M.metal, 0.1, 0.99, -0.15, 0.4, 1.02, 0.15);
    const tpe = placed(c, 0.25, -0.05, 0);
    blk(tpe, M.metal, -0.03, 0.99, -0.03, 0.03, 1.25, 0.03);
    const sm = new THREE.MeshStandardMaterial({ map: TX.screenTexture('Caisse'), emissive: '#fff', emissiveMap: TX.screenTexture('Caisse'), emissiveIntensity: 0.8 });
    emissives.push(sm);
    blk(tpe, sm, -0.2, 1.25, -0.02, 0.2, 1.5, 0.02);
    signPanel('Caisse', 0.12, 2.45, 4.75, FACE.east, 1.0, 0.3, { icon: 'cart' });
    // présentoir impulsions
    shelving(placed(S, 1.6, 5.75, FACE.north), 0.5, 0.3, 1.2, 3, PRODUCT_COLORS.epicerie);
  }
  // tapis d'entrée
  {
    const mt = new THREE.MeshStandardMaterial({ map: TX.matTexture(), roughness: 1 });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.9), mt);
    m.rotation.x = -Math.PI / 2;
    m.rotation.z = -Math.PI / 2;
    m.position.set(0.6, 0.005, 3.0);
    S.add(m);
  }
  plant(0.4, 2.0, 1.2);
  plant(0.4, 4.0, 1.2);

  // ===================== CAFÉ =============================================
  {
    const xc = X.cafe;
    // arrière-bar
    const bb = placed(S, 8.0, 0, FACE.south);
    blk(bb, M.forestDark, -1.8, 0, 0, 1.8, 0.95, 0.5);
    blk(bb, M.metal, -1.85, 0.95, 0, 1.85, 0.99, 0.55);
    for (const y of [1.45, 1.85]) blk(bb, M.wood, -1.8, y, 0, 1.8, y + 0.04, 0.3);
    for (let i = 0; i < 24; i++) I.add('bottle', bb, -1.7 + i * 0.145, 1.49 + 0.1, 0.15, 0.06, 0.2, 0.06, pick(['#6b3e26', '#d4a373', '#ffffff', '#2d6a4f'], i));
    for (let i = 0; i < 20; i++) I.add('box', bb, -1.7 + i * 0.17, 1.89 + 0.06, 0.15, 0.12, 0.12, 0.12, pick(['#f1e9db', '#2b2b2b', '#a47148'], i));
    // machine à espresso
    blk(bb, M.steel, -1.3, 0.99, 0.08, -0.5, 1.4, 0.48);
    blk(bb, M.metal, -1.3, 1.4, 0.08, -0.5, 1.45, 0.48);
    blk(bb, M.steel, 0.3, 0.99, 0.15, 0.6, 1.35, 0.45);
    // ardoises menu
    const menus = [
      ['Cafés', [['Espresso', '1,50'], ['Cappuccino', '2,80'], ['Latte', '3,20'], ['Thé', '2,00']]],
      ['Froid', [['Smoothie', '4,00'], ['Jus pressé', '3,50'], ['Iced latte', '3,80'], ['Limonade', '2,80']]],
      ['Snack', [['Croissant', '1,40'], ['Panini', '5,50'], ['Salade', '7,00'], ['Cookie', '2,00']]],
      ['Formules', [['Petit-déj', '4,50'], ['Midi', '9,90'], ['Goûter', '3,90'], ['Cowork', '6,00']]],
    ];
    menus.forEach(([t, l], i) => {
      const tex = TX.menuBoardTexture(t, l);
      const mm = new THREE.MeshStandardMaterial({ map: tex, emissive: '#fff', emissiveMap: tex, emissiveIntensity: 0.25 });
      emissives.push(mm);
      plane(groups.signs, mm, 0.8, 0.6, 6.65 + i * 0.9, 2.65, 0.02);
    });
    // comptoir
    const ct = placed(S, 7.8, 1.45, FACE.south);
    blk(ct, M.forestDark, -1.6, 0, -0.3, 1.6, 1.0, 0.3);
    for (let i = -1.55; i < 1.6; i += 0.07) blk(ct, M.wood, i, 0.05, 0.3, i + 0.04, 0.98, 0.33, { cast: false });
    blk(ct, M.metal, -1.65, 1.0, -0.35, 1.65, 1.05, 0.35);
    blk(ct, M.ledWarm, -1.6, 0.02, 0.33, 1.6, 0.04, 0.35, { cast: false });
    // vitrine pâtisseries
    blk(ct, M.metal, 0.4, 1.05, -0.3, 1.5, 1.1, 0.3);
    const vg = plane(groups.glass, M.glass, 1.1, 0.4, 0, 0, 0);
    vg.position.set(0.95, 1.3, 0.3);
    vg.applyMatrix4(ct.matrixWorld);
    blk(ct, M.white, 0.42, 1.25, -0.28, 1.48, 1.27, 0.28, { cast: false });
    for (let i = 0; i < 16; i++) I.add('sphere', ct, 0.5 + (i % 8) * 0.13, i < 8 ? 1.15 : 1.31, -0.1 + (i % 2) * 0.15, 0.1, 0.06, 0.1, pick(['#d9a066', '#8d5524', '#f1c27d', '#e76f51'], i));
    // caisse café
    blk(ct, M.metal, -1.3, 1.05, -0.15, -0.95, 1.3, 0.1);
    // enseigne Café
    signPanel('Café', 10.2, 2.4, 0.02, 0, 1.0, 0.9, { icon: 'cup', w: 512, h: 460 });
    // suspensions
    for (const [px, pz] of [[6.85, 2.85], [8.15, 2.85], [6.85, 4.35], [8.15, 4.35], [7.0, 1.45], [8.6, 1.45]]) pendant(px, pz, pz < 2 ? 1.0 : 1.3);
    // tables
    for (const [tx, tz] of [[6.85, 2.85], [8.15, 2.85], [6.85, 4.35], [8.15, 4.35]]) {
      table(tx, tz);
      chair(tx - 0.5, tz, FACE.east);
      chair(tx + 0.5, tz, FACE.west);
    }
    // coworking : comptoir haut le long de la vitrine sud
    blk(S, M.wood, xc + 0.15, 1.02, 5.45, 7.9, 1.07, 5.92);
    for (const sx of [xc + 0.25, 7.8]) blk(S, M.metal, sx - 0.03, 0, 5.85, sx + 0.03, 1.02, 5.91);
    for (let i = 0; i < 4; i++) {
      stool(6.25 + i * 0.5, 5.1);
      if (i % 2 === 0) {
        const lp = placed(S, 6.25 + i * 0.5, 5.65, FACE.north);
        blk(lp, M.steel, -0.16, 1.07, -0.11, 0.16, 1.085, 0.11);
        const sc = blk(lp, M.metal, -0.16, 1.085, -0.11, 0.16, 1.3, -0.1);
        void sc;
      }
    }
    blk(S, M.metal, xc + 0.15, 1.07, 5.86, 7.9, 1.12, 5.9); // bandeau prises
    signPanel('Coworking', 6.95, 2.55, 5.9, Math.PI, 1.4, 0.3);
    // espace détente : canapé contre la cloison laverie + fauteuils
    const sofa = placed(S, 10.65, 4.8, FACE.west);
    banquette(sofa, 1.6, M.fabric);
    blk(sofa, M.fabric, -0.85, 0, 0, -0.75, 0.7, 0.55);
    blk(sofa, M.fabric, 0.75, 0, 0, 0.85, 0.7, 0.55);
    table(9.75, 4.8, 0.3, 0.42, M.wood);
    chair(9.1, 4.4, FACE.east, M.fabricBeige);
    chair(9.1, 5.2, FACE.east, M.fabricBeige);
    signPanel('Détente', 10.77, 2.3, 4.8, FACE.west, 1.0, 0.28);
    // claustra bois côté supérette + jardinière
    for (let z = 4.55; z < 5.95; z += 0.12) blk(S, M.wood, xc - 0.03, 0, z, xc + 0.03, H, z + 0.05);
    blk(S, M.wood, xc - 0.25, 0, 4.4, xc + 0.25, 0.5, 4.55);
    plant(xc, 0.45, 1.3);
    plant(10.5, 0.4, 1.2);
    plant(9.6, 5.65, 1.0);
    for (const [hx, hz] of [[6.2, 0.4], [7.0, 0.4], [9.4, 0.4]]) hangingPlant(hx, hz);
  }

  // ===================== LAVERIE ==========================================
  {
    const xl = X.laverie;
    // lave-linge contre le mur nord
    const wm = placed(S, 13.1, 0, FACE.south);
    blk(wm, M.forestDark, -2.15, 0, 0, 2.15, 0.3, 0.8);
    for (let i = 0; i < 6; i++) washer(wm, -1.75 + i * 0.7);
    blk(wm, M.wood, -2.15, 1.7, 0, 2.15, 1.74, 0.35);
    for (let i = 0; i < 12; i++) I.add('bottle', wm, -2.0 + i * 0.35, 1.74 + 0.12, 0.17, 0.1, 0.24, 0.1, pick(PRODUCT_COLORS.lessive, i));
    signPanel('Laverie', 13.1, 2.7, 0.02, 0, 2.2, 0.5, { icon: 'washer' });
    // sèche-linge superposés contre la façade sud
    const dr = placed(S, 13.1, 6, FACE.north);
    for (let i = 0; i < 6; i++) {
      washer(dr, -1.75 + i * 0.7, 0.05, 0.7, 0.88, 0.75);
      washer(dr, -1.75 + i * 0.7, 0.95, 0.7, 0.88, 0.75);
    }
    signPanel('Sèche-linge', 13.1, 2.05, 5.92, Math.PI, 1.6, 0.25);
    // table de pliage centrale
    blk(S, M.woodLight, 12.4, 0.88, 2.6, 14.0, 0.93, 3.4);
    blk(S, M.forestDark, 12.5, 0, 2.7, 13.9, 0.88, 3.3);
    for (let i = 0; i < 5; i++) blk(S, M.linen, 12.5 + i * 0.3, 0.93, 2.75, 12.74 + i * 0.3, 0.93 + 0.05 * (1 + (i % 3)), 3.05, { cast: false });
    for (let i = 0; i < 4; i++) I.add('box', S, 12.65 + i * 0.4, 0.97, 3.22, 0.3, 0.06 + (i % 2) * 0.05, 0.25, pick(['#9ec1e0', '#f3f1ec', '#e9c46a', '#d98b8b'], i));
    signPanel('Pliage & repassage', 15.3, 2.45, 2.25, 0, 1.7, 0.32, { icon: 'hanger' });
    // planche à repasser + fer
    {
      const ib = placed(S, 15.6, 3.0, FACE.east);
      blk(ib, M.white, -0.65, 0.88, -0.18, 0.55, 0.91, 0.18);
      blk(ib, M.metal, -0.4, 0, -0.02, -0.36, 0.88, 0.02);
      blk(ib, M.metal, 0.3, 0, -0.02, 0.34, 0.88, 0.02);
      blk(ib, M.steel, 0.3, 0.91, -0.06, 0.48, 0.99, 0.06);
    }
    // portant de vêtements
    {
      const r = placed(S, 15.6, 4.6, 0);
      blk(r, M.metal, -0.6, 0, -0.02, -0.57, 1.7, 0.02);
      blk(r, M.metal, 0.57, 0, -0.02, 0.6, 1.7, 0.02);
      blk(r, M.chrome, -0.6, 1.62, -0.012, 0.6, 1.64, 0.012);
      for (let i = 0; i < 9; i++) I.add('box', r, -0.5 + i * 0.12, 1.25, 0, 0.04, 0.7, 0.4, pick(['#ffffff', '#cfe0f1', '#a8c5e6', '#f2f2f2', '#d9d9d9'], i));
    }
    // dépôt & retrait
    {
      const dd = placed(S, 15.95, 0, FACE.south);
      blk(dd, M.forestDark, -0.6, 0, 0, 0.6, 1.0, 0.55);
      blk(dd, M.wood, -0.65, 1.0, 0, 0.65, 1.05, 0.6);
      for (let i = 0; i < 4; i++) blk(dd, M.linen, -0.5 + i * 0.26, 1.05, 0.15, -0.3 + i * 0.26, 1.05 + 0.06 * (1 + (i % 2)), 0.45, { cast: false });
      blk(dd, M.wood, -0.6, 1.4, 0, 0.6, 1.43, 0.35);
      for (let i = 0; i < 6; i++) I.add('box', dd, -0.5 + i * 0.2, 1.53, 0.17, 0.16, 0.2, 0.28, pick(['#e8e1d6', '#9ec1e0', '#ffffff'], i));
      signPanel('Dépôt & retrait', 15.95, 2.45, 0.02, 0, 1.3, 0.36, { icon: 'basket', sub: 'du linge' });
    }
    // stockage produits laverie (mur est, entre portes)
    shelving(placed(S, X.back, 3.0, FACE.west), 1.2, 0.4, 2.0, 4, PRODUCT_COLORS.lessive);
    signPanel('Produits lessiviels', X.back - 0.06, 2.4, 3.0, FACE.west, 1.2, 0.25);
    // espace d'attente : banquettes contre la cloison vitrée
    banquette(placed(S, xl + 0.06, 4.45, FACE.east), 1.1);
    banquette(placed(S, xl + 0.06, 1.6, FACE.east), 1.1);
    signPanel('Attente', xl + 0.06, 2.35, 4.45, FACE.east, 0.9, 0.25);
    // enseigne d'accès sur la cloison côté café
    signPanel('Laverie →', xl - 0.06, 2.75, 3.0, FACE.west, 1.4, 0.3, { icon: 'washer' });
    plant(xl + 0.35, 5.6, 1.1);
    plant(16.35, 0.95, 0.9);
    hangingPlant(xl + 0.4, 2.0);
    hangingPlant(xl + 0.4, 4.0);
  }

  // ===================== RÉSERVE, TECHNIQUE, SANITAIRES ====================
  {
    // réserve : rayonnages métal
    const r1 = placed(S, 17.6, 0, FACE.south);
    shelving(r1, 1.7, 0.5, 2.3, 5, PRODUCT_COLORS.carton, { frame: M.steel, open: true });
    const r2 = placed(S, 20, 1.15, FACE.west);
    shelving(r2, 1.9, 0.5, 2.3, 5, PRODUCT_COLORS.carton, { frame: M.steel, open: true });
    signPanel('Réserve', 17.6, 2.75, 0.02, 0, 1.0, 0.25);
    // local technique
    cyl(S, M.blueTank, 0.35, 1.5, 17.25, 0.75, 3.0);
    cyl(S, M.blueTank, 0.35, 1.5, 18.0, 0.75, 3.0);
    blk(S, M.white, 19.6, 0.9, 2.6, 20, 2.0, 3.4); // tableau électrique / chaudière
    blk(S, M.metal, 19.58, 1.0, 2.7, 19.6, 1.9, 3.3);
    blk(S, M.white, 18.7, 0, 3.15, 19.2, 1.1, 3.6);
    for (const y of [2.4, 2.6]) blk(S, M.steel, X.back, y, 3.5, 20, y + 0.05, 3.55);
    cyl(S, M.steel, 0.03, 1.6, 17.25, 2.3, 3.0, { seg: 8 });
    cyl(S, M.steel, 0.03, 1.6, 18.0, 2.3, 3.0, { seg: 8 });
    // sanitaires hommes
    for (const ux of [17.9, 18.5]) {
      const u = placed(S, ux, 3.6, FACE.south);
      blk(u, M.porcelain, -0.18, 0.5, 0, 0.18, 1.15, 0.3);
      blk(u, M.forestDark, -0.32, 0.4, 0, -0.3, 1.4, 0.4);
    }
    {
      const lv = placed(S, 17.25, 4.8, FACE.north);
      blk(lv, M.porcelain, -0.3, 0.8, 0, 0.3, 0.88, 0.4);
      blk(lv, M.chrome, -0.02, 0.88, 0.05, 0.02, 1.05, 0.1);
      blk(lv, M.mirror, -0.35, 1.2, 0, 0.35, 1.9, 0.02);
    }
    blk(S, M.forestDark, 19.0, 0, 3.65, 19.04, 2.1, 4.75); // cabine WC
    blk(S, M.porcelain, 19.35, 0, 4.0, 19.75, 0.42, 4.4);
    blk(S, M.porcelain, 19.85, 0.4, 4.0, 19.98, 0.8, 4.4);
    plant(16.95, 4.55, 0.6);
    // sanitaires femmes
    {
      const lv = placed(S, 17.4, 4.8, FACE.south);
      blk(lv, M.white, -0.6, 0.78, 0, 0.6, 0.88, 0.45);
      cyl(lv, M.porcelain, 0.16, 0.06, -0.3, 0.9, 0.22);
      cyl(lv, M.porcelain, 0.16, 0.06, 0.3, 0.9, 0.22);
      for (const mx of [-0.3, 0.3]) {
        const mr = cyl(lv, M.mirror, 0.24, 0.02, mx, 1.55, 0.02, { axis: 'z', seg: 32 });
        void mr;
      }
    }
    blk(S, M.forestDark, 18.3, 0, 4.85, 18.34, 2.1, 5.95);
    blk(S, M.forestDark, 19.15, 0, 4.85, 19.19, 2.1, 5.95);
    for (const wx of [18.75, 19.6]) {
      blk(S, M.porcelain, wx - 0.2, 0, 5.45, wx + 0.2, 0.42, 5.9);
      blk(S, M.porcelain, wx - 0.2, 0.4, 5.85, wx + 0.2, 0.8, 5.98);
    }
    plant(16.95, 5.7, 0.6);
  }

  // revêtements muraux des pièces humides / techniques
  for (const z of ZONES.filter((q) => q.x0 >= X.back)) {
    const wet = z.id.startsWith('wc');
    const lo = wet ? (z.id === 'wc-h' ? M.wallTile : M.wallTileLight) : M.concrete;
    const hi = wet ? M.wallTile : M.concrete;
    const e = 0.06, h = wet ? 1.3 : H - 0.01;
    const w = z.x1 - z.x0, d = z.z1 - z.z0;
    const cx = (z.x0 + z.x1) / 2, cz = (z.z0 + z.z1) / 2;
    const set = (mat, y0, y1) => {
      const hh = y1 - y0, yc = (y0 + y1) / 2;
      const a = (m, ww) => { const c = m.clone(); if (c.map) { c.map = c.map.clone(); c.map.repeat.set(ww / 0.6, hh / 0.6); c.map.needsUpdate = true; } return c; };
      plane(S, a(mat, w), w, hh, cx, yc, z.z0 + e, 0);
      plane(S, a(mat, w), w, hh, cx, yc, z.z1 - e, Math.PI);
      plane(S, a(mat, d), d, hh, z.x1 - e, yc, cz, -Math.PI / 2);
      const side = plane(S, a(mat, d), d, hh, z.x0 + e, yc, cz, Math.PI / 2);
      side.visible = !wet || true;
    };
    set(lo, 0, h);
    if (wet) set(hi, h, h + 0.08);
  }

  // ===================== EXTÉRIEUR ========================================
  const E = groups.exterior;
  {
    const grass = M.grass.clone();
    grass.map = grass.map.clone();
    grass.map.repeat.set(30, 30);
    const g = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), grass);
    g.rotation.x = -Math.PI / 2;
    g.position.set(10, -0.02, 5);
    g.receiveShadow = true;
    E.add(g);
    // trottoirs (ouest + sud)
    const sw = M.concrete.clone();
    sw.map = sw.map.clone();
    sw.map.repeat.set(12, 2);
    blk(E, sw, -3.5, -0.02, -1.5, 0 - W, 0.05, SITE.parking.z0, { cast: false });
    blk(E, sw, -W, -0.02, D + W, L + 1.5, 0.05, SITE.parking.z0, { cast: false });
    // terrasse bois
    const { terrace: t } = SITE;
    blk(E, M.wood, t.x0, 0.05, t.z0, t.x1, 0.12, t.z1);
    for (const [tx, tz] of [[6.9, 7.1], [8.3, 7.7], [9.7, 7.1]]) {
      table(tx, tz, 0.35, 0.87, M.woodLight);
      chair(tx - 0.5, tz, FACE.east);
      chair(tx + 0.5, tz, FACE.west);
      cyl(E, M.metal, 0.025, 2.4, tx, 1.3, tz, { seg: 6 });
      const um = new THREE.Mesh(new THREE.ConeGeometry(1.25, 0.45, 8, 1, true), M.fabricBeige);
      um.material = M.fabricBeige.clone();
      um.material.side = THREE.DoubleSide;
      um.position.set(tx, 2.45, tz);
      um.castShadow = true;
      E.add(um);
    }
    // parking
    const p = SITE.parking;
    blk(E, M.asphalt, -6, -0.02, p.z0, 24, 0.03, p.z1 + 6, { cast: false });
    const sp = (p.x1 - p.x0) / p.spaces;
    for (let i = 0; i <= p.spaces; i++) blk(E, M.lineWhite, p.x0 + i * sp - 0.05, 0.03, p.z0 + 0.3, p.x0 + i * sp + 0.05, 0.035, p.z0 + 5.3, { cast: false });
    blk(E, M.lineYellow, p.x0, 0.03, p.z0 + 0.25, p.x1, 0.035, p.z0 + 0.32, { cast: false });
    // voitures stylisées
    const car = (cx, cz, mat) => {
      const c = placed(E, cx, cz, 0);
      blk(c, mat, -0.85, 0.3, -2.1, 0.85, 0.85, 2.1);
      blk(c, mat, -0.8, 0.85, -1.1, 0.8, 1.35, 1.0);
      blk(c, M.darkGlass, -0.81, 0.9, -1.0, 0.81, 1.3, 0.9, { cast: false });
      for (const [wx, wz] of [[-0.8, -1.35], [0.8, -1.35], [-0.8, 1.35], [0.8, 1.35]]) cyl(c, M.tire, 0.32, 0.22, wx, 0.32, wz, { axis: 'x' });
    };
    car(p.x0 + sp * 1.5, p.z0 + 2.8, M.car1);
    car(p.x0 + sp * 4.5, p.z0 + 2.8, M.car2);
    // arbres
    const tree = (tx, tz, s = 1) => {
      cyl(E, M.wood, 0.12 * s, 2.4 * s, tx, 1.2 * s, tz, { seg: 8 });
      const tp = placed(E, tx, tz);
      for (let i = 0; i < 14; i++) {
        const a = i * 2.3;
        I.add('leaf', tp, Math.cos(a) * 0.9 * s, (2.6 + (i % 4) * 0.35) * s, Math.sin(a) * 0.9 * s, 1.4 * s, 1.1 * s, 1.4 * s, pick(['#3f7d36', '#2f6b2c', '#5a9a3c'], i), a);
      }
    };
    for (const [tx, tz] of [[-2.8, -1.5], [19.5, 8.4], [22, 2], [-5, 19], [26, 15], [10, 22], [-8, 2]]) tree(tx, tz, 1);
    // jardinières façade
    for (const x of [0.6, 4.8, 11.5, 15.5]) {
      blk(E, M.metal, x - 0.5, 0.05, D + W + 0.05, x + 0.5, 0.55, D + W + 0.5);
      const pp = placed(E, x, D + W + 0.28);
      for (let i = 0; i < 8; i++) I.add('leaf', pp, -0.4 + i * 0.11, 0.7 + (i % 3) * 0.1, 0, 0.3, 0.35, 0.3, '#3f7d36', i);
    }
    for (const z of [0.8, 5.2]) {
      blk(E, M.metal, -W - 0.5, 0.05, z - 0.5, -W - 0.05, 0.55, z + 0.5);
      const pp = placed(E, -W - 0.28, z);
      for (let i = 0; i < 8; i++) I.add('leaf', pp, 0, 0.7 + (i % 3) * 0.1, -0.4 + i * 0.11, 0.3, 0.35, 0.3, '#3f7d36', i);
    }
    // bandeau de façade : tasseaux bois sur acrotère
    for (let z = -W; z < D + W; z += 0.14) blk(E, M.wood, -W - 0.06, H + 0.05, z, -W, H + 0.85, z + 0.07, { cast: false });
    for (let x = -W; x < L + W; x += 0.14) blk(E, M.wood, x, H + 0.05, D + W, x + 0.07, H + 0.85, D + W + 0.06, { cast: false });
    // auvent noir au-dessus de l'entrée
    blk(E, M.metal, -1.4, 2.65, 1.6, -W, 2.75, 4.4);
    // enseignes lumineuses
    const big = (text, sub, x, y, z, rotY, w, h, icon = 'cart') => {
      const tex = TX.signTexture(text, { icon, sub, w: 1024, h: Math.round((1024 * h) / w), bg: '#121614' });
      const mat = new THREE.MeshStandardMaterial({ map: tex, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.6 });
      emissives.push(mat);
      plane(groups.signs, mat, w, h, x, y, z, rotY);
    };
    big('Daily Hub', 'Concept Store', -W - 0.08, H + 0.45, 3.0, -Math.PI / 2, 3.6, 0.85);
    big('Daily Hub', 'Concept Store', 4.0, H + 0.45, D + W + 0.08, 0, 3.6, 0.85);
    big('Supérette', null, 1.6, 2.95, D + W + 0.02, 0, 1.6, 0.3, 'basket');
    big('Café', null, 8.6, 2.95, D + W + 0.02, 0, 1.0, 0.3, 'cup');
    big('Laverie', null, 13.8, 2.95, D + W + 0.02, 0, 1.4, 0.3, 'washer');
    // totem parking
    const tt = placed(E, 19.2, 8.9, FACE.south);
    blk(tt, M.metal, -0.35, 0, -0.1, 0.35, 2.6, 0.1);
    const ttex = TX.signTexture('P', { sub: 'Clients', w: 256, h: 512, bg: '#1f4a36' });
    const tmat = new THREE.MeshStandardMaterial({ map: ttex, emissive: '#fff', emissiveMap: ttex, emissiveIntensity: 0.4 });
    emissives.push(tmat);
    plane(tt, tmat, 0.6, 1.2, 0, 1.9, 0.11);
  }

  I.build(root, M);
  mergeStatic(groups.static);
  mergeStatic(groups.exterior);
  mergeStatic(groups.ceiling);

  // ----------------------------------------------------------- jour / nuit
  const dayNight = (night) => {
    for (const m of emissives) {
      m.userData.day ??= m.emissiveIntensity;
      m.emissiveIntensity = night ? 1.6 : m.userData.day;
    }
    M.ledWarm.emissiveIntensity = night ? 3.5 : 2.2;
    M.ledCool.emissiveIntensity = night ? 4 : 2;
    M.fridgeLight.emissiveIntensity = night ? 2 : 1.2;
    for (const l of pointLights) l.intensity = (l.userData.base ??= l.intensity) * (night ? 1.35 : 1);
  };

  const collide = COLLIDE;
  COLLIDE = null;
  return { root, groups, materials: M, dayNight, collide };
}

// Fusionne les maillages statiques par matériau (beaucoup moins d'appels GPU).
function mergeStatic(group) {
  group.updateMatrixWorld(true);
  const byMat = new Map();
  const keep = [];
  group.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh) return;
    if (Array.isArray(o.material)) {
      keep.push(o);
      return;
    }
    const g = o.geometry.clone().applyMatrix4(o.matrixWorld);
    const ng = g.index ? g.toNonIndexed() : g;
    for (const k of Object.keys(ng.attributes)) if (!['position', 'normal', 'uv'].includes(k)) ng.deleteAttribute(k);
    const list = byMat.get(o.material) || [];
    list.push(ng);
    byMat.set(o.material, list);
  });
  const multi = keep.map((o) => {
    o.updateMatrixWorld(true);
    const m = o.clone();
    m.matrix.copy(o.matrixWorld);
    m.matrix.decompose(m.position, m.quaternion, m.scale);
    return m;
  });
  group.clear();
  group.position.set(0, 0, 0);
  group.rotation.set(0, 0, 0);
  group.scale.set(1, 1, 1);
  for (const [mat, geos] of byMat) {
    const merged = mergeGeometries(geos, false);
    const m = new THREE.Mesh(merged, mat);
    m.castShadow = m.receiveShadow = true;
    if (mat.transparent) m.renderOrder = 2;
    group.add(m);
  }
  for (const m of multi) group.add(m);
}
