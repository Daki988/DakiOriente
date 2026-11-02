// Visite virtuelle DAILY HUB : navigation libre dans le modèle 3D.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createStage } from '../model/stage.js';
import { VIEWS, EXTRA_NODES, ZONE_MENU } from '../model/views.js';
import { ZONES, PARTITIONS, BUILDING, SITE, area } from '../model/plan.js';
import { WalkGrid } from '../model/collision.js';

const $ = (s) => document.querySelector(s);
const EYE = 1.6;
const ZONE_LABEL = { exterieur: 'Extérieur', superette: 'Supérette', cafe: 'Café', laverie: 'Laverie', annexes: 'Annexes', plan: 'Maquette 3D' };
const ZONE_ICON = {
  exterieur: '<path d="M3 11l9-7 9 7v9H3z"/><path d="M9 20v-6h6v6"/>',
  superette: '<path d="M2 4h2.5l2.2 10.2h10.6L19.6 7H6"/><circle cx="9" cy="19" r="1.4"/><circle cx="16.5" cy="19" r="1.4"/>',
  cafe: '<path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M16 10h2a2.5 2.5 0 0 1 0 5h-2"/><path d="M8 3v3M12 3v3"/>',
  laverie: '<rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="13" r="4" fill="none" stroke="currentColor"/><path d="M4 7h16"/>',
  annexes: '<path d="M4 20V8l8-4 8 4v12"/><path d="M9 20v-6h6v6"/>',
  plan: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
};

const mobile = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
const nodes = [...VIEWS.filter((v) => !v.cutaway), ...EXTRA_NODES];
const zoneOfPoint = (x, z) => {
  const zn = ZONES.find((q) => x >= q.x0 && x <= q.x1 && z >= q.z0 && z <= q.z1);
  if (!zn) return 'exterieur';
  return ['reserve', 'technique', 'wc-h', 'wc-f'].includes(zn.id) ? 'annexes' : zn.id;
};
const lookAngles = (pos, target) => {
  const dx = target[0] - pos[0], dy = target[1] - pos[1], dz = target[2] - pos[2];
  return { yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(dy, Math.hypot(dx, dz)) };
};
const angDiff = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const smooth = (a, b, t) => { const x = Math.min(1, Math.max(0, (t - a) / (b - a))); return x * x * (3 - 2 * x); };

// --------------------------------------------------------------- démarrage
const bar = $('#bar');
const progress = (p) => (bar.style.width = `${Math.round(p * 100)}%`);
await Promise.race([document.fonts.load('700 40px Poppins'), new Promise((r) => setTimeout(r, 2500))]);
progress(0.2);
await new Promise((r) => requestAnimationFrame(r));

const canvas = $('#scene');
const stage = createStage(canvas, { quality: mobile ? 'medium' : 'high' });
const { renderer, scene, camera, hub } = stage;
renderer.shadowMap.autoUpdate = false;
renderer.shadowMap.needsUpdate = true;
progress(0.6);

const grid = new WalkGrid();
for (const r of hub.collide) grid.addRect(...r);
grid.finalize(0.25);
progress(0.8);

// --------------------------------------------------------------- état
const state = {
  mode: 'walk',
  pos: new THREE.Vector3(),
  yaw: 0,
  pitch: 0,
  fov: 65,
  night: false,
  anim: null,
  dirty: true,
  at: null, // nœud courant
};
camera.rotation.order = 'YXZ';
const orbit = new OrbitControls(camera, canvas);
orbit.enabled = false;
orbit.enableDamping = true;
orbit.target.set(10, 0, 3);
orbit.maxPolarAngle = Math.PI * 0.47;
orbit.minDistance = 8;
orbit.maxDistance = 45;
orbit.addEventListener('change', () => (state.dirty = true));

function resize() {
  const dpr = Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2);
  stage.resize(innerWidth, innerHeight, dpr);
  state.dirty = true;
}
addEventListener('resize', resize);
resize();

function applyCamera() {
  if (state.mode !== 'walk') return;
  camera.position.copy(state.pos);
  camera.rotation.set(state.pitch, state.yaw, 0);
  if (camera.fov !== state.fov) {
    camera.fov = state.fov;
    camera.updateProjectionMatrix();
  }
}

// --------------------------------------------------------------- hotspots
const hsGroup = new THREE.Group();
scene.add(hsGroup);
const ringGeo = new THREE.RingGeometry(0.2, 0.28, 40).rotateX(-Math.PI / 2);
const discGeo = new THREE.CircleGeometry(0.2, 40).rotateX(-Math.PI / 2);
const hitGeo = new THREE.CircleGeometry(0.55, 16).rotateX(-Math.PI / 2);
const ringMat = new THREE.MeshBasicMaterial({ color: '#a4d03c', transparent: true, opacity: 0.95, depthWrite: false });
const discMat = new THREE.MeshBasicMaterial({ color: '#12291e', transparent: true, opacity: 0.45, depthWrite: false });
const hitMat = new THREE.MeshBasicMaterial({ visible: false });
let hotspots = [];
const labelsEl = $('#labels');

function updateHotspots() {
  hsGroup.clear();
  labelsEl.innerHTML = '';
  hotspots = [];
  if (state.mode !== 'walk') return;
  const { x, z } = state.pos;
  const cand = nodes
    .map((n) => ({ n, d: Math.hypot(n.pos[0] - x, n.pos[2] - z) }))
    .filter(({ d }) => d > 0.7 && d < 9)
    .sort((a, b) => a.d - b.d);
  const picked = [];
  for (const c of cand) {
    if (picked.length >= 7) break;
    if (!(grid.free(x, z) ? grid.los(x, z, c.n.pos[0], c.n.pos[2]) : grid.losRaw(x, z, c.n.pos[0], c.n.pos[2]))) continue;
    // évite deux cercles quasiment superposés
    if (picked.some((p) => Math.hypot(p.n.pos[0] - c.n.pos[0], p.n.pos[2] - c.n.pos[2]) < 1.0)) continue;
    picked.push(c);
  }
  for (const { n } of picked) {
    const g = new THREE.Group();
    g.position.set(n.pos[0], 0.03, n.pos[2]);
    const ring = new THREE.Mesh(ringGeo, ringMat);
    const disc = new THREE.Mesh(discGeo, discMat);
    const hit = new THREE.Mesh(hitGeo, hitMat);
    ring.renderOrder = disc.renderOrder = 3;
    hit.userData.node = n;
    g.add(disc, ring, hit);
    hsGroup.add(g);
    const el = document.createElement('div');
    el.className = 'hs';
    el.innerHTML = `${n.n ? `<b>${n.n}</b>` : '<b>›</b>'}${n.title}`;
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      goToNode(n);
    });
    labelsEl.appendChild(el);
    hotspots.push({ n, g, el });
  }
  state.dirty = true;
}

const _v = new THREE.Vector3();
function placeLabels() {
  const w = innerWidth, h = innerHeight;
  const placedPts = [];
  for (const hsp of hotspots) {
    _v.set(hsp.n.pos[0], 0.45, hsp.n.pos[2]);
    const d = _v.distanceTo(camera.position);
    _v.project(camera);
    const sx = ((_v.x + 1) / 2) * w, sy = ((1 - _v.y) / 2) * h;
    // pas d'étiquettes empilées : la plus proche gagne (liste triée par distance)
    const vis = _v.z < 1 && Math.abs(_v.x) < 1.1 && Math.abs(_v.y) < 1.1 && d < 9 && !placedPts.some(([px, py]) => Math.abs(px - sx) < 130 && Math.abs(py - sy) < 30);
    hsp.el.style.display = vis ? '' : 'none';
    if (vis) {
      placedPts.push([sx, sy]);
      hsp.el.style.left = `${sx}px`;
      hsp.el.style.top = `${sy}px`;
      hsp.el.style.opacity = String(Math.max(0.35, 1 - d / 10));
    }
  }
  for (const zl of zoneLabels) {
    _v.set(zl.x, 1.2, zl.z).project(camera);
    zl.el.style.display = state.mode === 'orbit' && _v.z < 1 ? '' : 'none';
    zl.el.style.left = `${((_v.x + 1) / 2) * w}px`;
    zl.el.style.top = `${((1 - _v.y) / 2) * h}px`;
  }
}

// --------------------------------------------------------------- déplacements
function goToNode(n, opts = {}) {
  const a = lookAngles(n.pos, n.target);
  moveTo(n.pos[0], n.pos[2], { yaw: a.yaw, pitch: a.pitch, y: n.pos[1], fov: n.fov ? Math.max(55, n.fov) : 65, node: n, ...opts });
}

function moveTo(x, z, { yaw, pitch = 0, y = EYE, fov, node = null, instant = false } = {}) {
  if (state.mode !== 'walk') enterWalk();
  // petites pièces (WC, local technique) : la cible exacte n'est pas « libre »
  if (node && !grid.free(x, z) && Math.hypot(x - state.pos.x, z - state.pos.z) > 0.3) instant = true;
  const path = instant ? null : grid.path(state.pos.x, state.pos.z, x, z);
  const end = path ? path[path.length - 1] : node ? [x, z] : grid.nearestFree(x, z, 2) || [x, z];
  // si la cible exacte est libre (nœud), on la garde
  if (grid.free(x, z)) {
    end[0] = x;
    end[1] = z;
  }
  const finish = () => {
    state.at = node;
    if (node?.n) history.replaceState(null, '', `#vue-${node.n}`);
    updateHUD();
    updateHotspots();
  };
  if (!path || instant) {
    // téléportation avec fondu (trajet impossible ou demandé)
    fade(() => {
      state.pos.set(end[0], y, end[1]);
      if (yaw !== undefined) state.yaw = yaw;
      state.pitch = pitch;
      if (fov) state.fov = fov;
      finish();
    });
    return;
  }
  path[path.length - 1] = end;
  const segs = [];
  let len = 0;
  for (let i = 1; i < path.length; i++) {
    const l = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
    segs.push(l);
    len += l;
  }
  const dur = Math.min(4.5, Math.max(0.6, len / 2.0));
  hotspots.forEach((h) => (h.el.style.display = 'none'));
  hsGroup.clear();
  labelsEl.innerHTML = '';
  hotspots = [];
  state.anim = {
    t0: performance.now(), dur, path, segs, len,
    y0: state.pos.y, y1: y,
    yaw0: state.yaw, yaw1: yaw, pitch0: state.pitch, pitch1: pitch,
    fov0: state.fov, fov1: fov ?? state.fov,
    finish,
  };
}

function stepAnim(now) {
  const a = state.anim;
  if (!a) return;
  const t = Math.min(1, (now - a.t0) / (a.dur * 1000));
  const e = ease(t);
  // position le long du trajet
  let s = e * a.len, i = 0;
  while (i < a.segs.length - 1 && s > a.segs[i]) s -= a.segs[i++];
  const p0 = a.path[i], p1 = a.path[i + 1], f = a.segs[i] ? s / a.segs[i] : 1;
  state.pos.set(p0[0] + (p1[0] - p0[0]) * f, a.y0 + (a.y1 - a.y0) * e, p0[1] + (p1[1] - p0[1]) * f);
  // regard : direction de marche, puis orientation finale
  const moveYaw = Math.atan2(-(p1[0] - p0[0]), -(p1[1] - p0[1]));
  const walkYaw = a.yaw0 + angDiff(a.yaw0, moveYaw) * smooth(0, 0.25, t);
  const target = a.yaw1 ?? moveYaw;
  state.yaw = walkYaw + angDiff(walkYaw, target) * smooth(0.55, 1, t);
  state.pitch = a.pitch0 + (a.pitch1 - a.pitch0) * smooth(0.4, 1, t) - 0.06 * Math.sin(Math.PI * t) * (a.len > 2 ? 1 : 0);
  state.fov = a.fov0 + (a.fov1 - a.fov0) * e;
  state.dirty = true;
  if (t >= 1) {
    state.anim = null;
    a.finish();
  }
}

function fade(mid) {
  const el = $('#fade');
  el.classList.add('on');
  setTimeout(() => {
    mid();
    state.dirty = true;
    setTimeout(() => el.classList.remove('on'), 60);
  }, 350);
}

// --------------------------------------------------------------- maquette 3D
const zoneLabels = [];
for (const [id, title, zs] of [
  ['superette', 'Supérette', ['superette']],
  ['cafe', 'Café', ['cafe']],
  ['laverie', 'Laverie', ['laverie']],
  ['annexes', 'Réserve & sanitaires', ['reserve', 'technique', 'wc-h', 'wc-f']],
]) {
  const zz = ZONES.filter((q) => zs.includes(q.id));
  const x = (Math.min(...zz.map((q) => q.x0)) + Math.max(...zz.map((q) => q.x1))) / 2;
  const z = (Math.min(...zz.map((q) => q.z0)) + Math.max(...zz.map((q) => q.z1))) / 2;
  const m2 = Math.round(zz.reduce((s, q) => s + area(q), 0));
  const el = document.createElement('div');
  el.className = 'zl';
  el.innerHTML = `<strong>${title}</strong><small>${m2} m² · entrer</small>`;
  el.style.display = 'none';
  el.addEventListener('click', () => {
    const start = ZONE_MENU.find((q) => q.id === id).start;
    flyIntoView(VIEWS.find((v) => v.n === start));
  });
  document.body.appendChild(el);
  zoneLabels.push({ x, z, el });
}

function enterOrbit(view = VIEWS.find((v) => v.n === 33)) {
  state.anim = null;
  state.mode = 'orbit';
  hsGroup.clear();
  labelsEl.innerHTML = '';
  hotspots = [];
  stage.setCutaway(true);
  camera.fov = view.fov;
  camera.position.set(...view.pos);
  orbit.target.set(...view.target);
  camera.updateProjectionMatrix();
  orbit.enabled = true;
  orbit.update();
  state.at = view;
  updateHUD();
  state.dirty = true;
}

function enterWalk() {
  state.mode = 'walk';
  orbit.enabled = false;
  stage.setCutaway(false);
  zoneLabels.forEach((z) => (z.el.style.display = 'none'));
}

function flyIntoView(v) {
  // transition caméra maquette → intérieur, puis bascule en marche
  const from = camera.position.clone(), q0 = camera.quaternion.clone();
  const a = lookAngles(v.pos, v.target);
  const q1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(a.pitch, a.yaw, 0, 'YXZ'));
  const to = new THREE.Vector3(...v.pos);
  const fov0 = camera.fov, t0 = performance.now(), dur = 1600;
  orbit.enabled = false;
  zoneLabels.forEach((z) => (z.el.style.display = 'none'));
  state.mode = 'fly';
  const tick = (now) => {
    const t = Math.min(1, (now - t0) / dur), e = ease(t);
    camera.position.lerpVectors(from, to, e);
    camera.quaternion.slerpQuaternions(q0, q1, e);
    camera.fov = fov0 + (65 - fov0) * e;
    camera.updateProjectionMatrix();
    if (t > 0.75) stage.setCutaway(false);
    state.dirty = true;
    if (t < 1) requestAnimationFrame(tick);
    else {
      state.pos.copy(to);
      Object.assign(state, { yaw: a.yaw, pitch: a.pitch, fov: 65 });
      enterWalk();
      state.at = v;
      history.replaceState(null, '', `#vue-${v.n}`);
      updateHUD();
      updateHotspots();
    }
  };
  requestAnimationFrame(tick);
}

function openView(v) {
  closeAll();
  if (v.cutaway) {
    if (v.n === 32) enterOrbit({ ...v, pos: [10, 26, 6.5] });
    else enterOrbit(v);
    history.replaceState(null, '', `#vue-${v.n}`);
    return;
  }
  if (state.mode === 'orbit') return flyIntoView(v);
  if (v.night !== undefined && !!v.night !== state.night) setNight(!!v.night);
  const far = Math.hypot(v.pos[0] - state.pos.x, v.pos[2] - state.pos.z) > 14;
  goToNode(v, { instant: far });
}

// --------------------------------------------------------------- HUD
const zonesEl = $('#zones');
for (const z of ZONE_MENU) {
  const b = document.createElement('button');
  b.className = 'chip';
  b.dataset.zone = z.id;
  b.innerHTML = `<svg viewBox="0 0 24 24" class="ico">${ZONE_ICON[z.id]}</svg>${z.label}`;
  b.addEventListener('click', () => openView(VIEWS.find((v) => v.n === z.start)));
  zonesEl.appendChild(b);
}

function currentZone() {
  if (state.mode !== 'walk') return 'plan';
  return zoneOfPoint(state.pos.x, state.pos.z);
}
function updateHUD() {
  const zone = currentZone();
  const zn = ZONES.find((q) => state.pos.x >= q.x0 && state.pos.x <= q.x1 && state.pos.z >= q.z0 && state.pos.z <= q.z1);
  $('#where-zone').textContent = state.mode !== 'walk' ? 'Maquette 3D' : state.at ? ZONE_LABEL[state.at.zone] : zn ? zn.name : 'Extérieur';
  $('#where-title').textContent = state.at?.title ?? (state.mode === 'walk' ? 'Visite libre' : 'Vue d’ensemble');
  for (const c of zonesEl.children) c.classList.toggle('on', c.dataset.zone === (state.at?.zone ?? zone));
  document.querySelectorAll('.card').forEach((c) => c.classList.toggle('on', +c.dataset.n === state.at?.n));
  updateMinimap();
}

// Points de vue (feuille)
const sheetBody = $('#sheet-body');
for (const z of ZONE_MENU) {
  const list = VIEWS.filter((v) => v.zone === z.id);
  if (!list.length) continue;
  const sec = document.createElement('div');
  sec.innerHTML = `<h3>${ZONE_LABEL[z.id]}</h3><div class="grid">${list
    .map((v) => `<button class="card" data-n="${v.n}"><img loading="lazy" src="/thumbs/${String(v.n).padStart(2, '0')}.webp" alt=""><span><b>${v.n}</b>${v.title}</span></button>`)
    .join('')}</div>`;
  sheetBody.appendChild(sec);
}
sheetBody.addEventListener('click', (e) => {
  const c = e.target.closest('.card');
  if (c) openView(VIEWS.find((v) => v.n === +c.dataset.n));
});

function closeAll() {
  $('#sheet').classList.remove('open');
  $('#plan').classList.remove('open');
  $('#btn-list').classList.remove('on');
  $('#btn-plan').classList.remove('on');
}
document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', closeAll));
$('#plan').addEventListener('click', (e) => e.target.id === 'plan' && closeAll());
$('#btn-list').addEventListener('click', () => {
  const open = !$('#sheet').classList.contains('open');
  closeAll();
  $('#sheet').classList.toggle('open', open);
  $('#btn-list').classList.toggle('on', open);
});
$('#btn-plan').addEventListener('click', () => {
  const open = !$('#plan').classList.contains('open');
  closeAll();
  $('#plan').classList.toggle('open', open);
  $('#btn-plan').classList.toggle('on', open);
  updateMinimap();
});
function setNight(n) {
  state.night = n;
  stage.setNight(n);
  renderer.shadowMap.needsUpdate = true;
  $('#btn-night').classList.toggle('on', n);
  state.dirty = true;
}
$('#btn-night').addEventListener('click', () => setNight(!state.night));
$('#btn-fs').addEventListener('click', () => {
  const d = document;
  if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
  else {
    const el = d.documentElement;
    (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
  }
});
const zoomBy = (k) => {
  if (state.mode === 'walk') {
    state.fov = Math.min(80, Math.max(28, state.fov * k));
    state.dirty = true;
  } else {
    orbit.dollyIn?.(1 / k);
    camera.position.lerp(orbit.target, k < 1 ? 0.15 : -0.15);
    orbit.update();
  }
};
$('#zoom-in').addEventListener('click', () => zoomBy(0.85));
$('#zoom-out').addEventListener('click', () => zoomBy(1.18));

// --------------------------------------------------------------- plans SVG
function planSVG({ full }) {
  const vb = full ? [-9, -2.5, 33, 19] : [-0.5, -0.5, 21, 7];
  const s = [];
  s.push(`<svg viewBox="${vb.join(' ')}" xmlns="http://www.w3.org/2000/svg" font-family="Poppins, sans-serif">`);
  if (full) {
    const p = SITE.parking;
    s.push(`<rect x="-9" y="-2.5" width="33" height="19" fill="#3d6b33"/>`);
    s.push(`<rect x="-3.5" y="-1.5" width="${3.5 + BUILDING.length + 1.5}" height="${p.z0 + 1.5}" fill="#b8b4ab"/>`);
    s.push(`<rect x="-6" y="${p.z0}" width="30" height="7.5" fill="#44474b"/>`);
    const sp = (p.x1 - p.x0) / p.spaces;
    for (let i = 0; i <= p.spaces; i++) s.push(`<rect x="${p.x0 + i * sp - 0.05}" y="${p.z0 + 0.3}" width="0.1" height="5" fill="#eee"/>`);
    const t = SITE.terrace;
    s.push(`<rect x="${t.x0}" y="${t.z0}" width="${t.x1 - t.x0}" height="${t.z1 - t.z0}" fill="#b98552"/>`);
    s.push(`<text x="${(p.x0 + p.x1) / 2}" y="${p.z0 + 6.4}" fill="#fff" font-size="0.7" text-anchor="middle">Parking clients</text>`);
    s.push(`<text x="${(t.x0 + t.x1) / 2}" y="${t.z1 - 0.5}" fill="#fff" font-size="0.5" text-anchor="middle">Terrasse</text>`);
  }
  const colors = { superette: '#2d6a4f', cafe: '#8a5a33', laverie: '#3b6f84', reserve: '#5b5b55', technique: '#4a4a46', 'wc-h': '#3e4e48', 'wc-f': '#3e4e48' };
  s.push(`<rect x="-0.2" y="-0.2" width="20.4" height="6.4" fill="#111"/>`);
  for (const z of ZONES) {
    s.push(`<rect x="${z.x0}" y="${z.z0}" width="${z.x1 - z.x0}" height="${z.z1 - z.z0}" fill="${colors[z.id]}"/>`);
    const big = z.x1 - z.x0 > 4;
    const fs = big ? (full ? 0.55 : 0.75) : 0.27;
    if (full || big) {
      s.push(`<text x="${(z.x0 + z.x1) / 2}" y="${(z.z0 + z.z1) / 2 - (big ? 0.2 : 0)}" fill="#fff" font-size="${fs}" font-weight="600" text-anchor="middle">${big ? z.name : z.name.replace('Sanitaires ', 'WC ')}</text>`);
      if (big) s.push(`<text x="${(z.x0 + z.x1) / 2}" y="${(z.z0 + z.z1) / 2 + fs * 0.9}" fill="#a4d03c" font-size="${fs * 0.75}" text-anchor="middle">${Math.round(area(z))} m²</text>`);
      else s.push(`<text x="${(z.x0 + z.x1) / 2}" y="${(z.z0 + z.z1) / 2 + 0.33}" fill="#a4d03c" font-size="0.22" text-anchor="middle">${Math.round(area(z))} m²</text>`);
    }
  }
  for (const p of PARTITIONS) {
    const [ax, az] = p.a, [bx, bz] = p.b, alongX = az === bz;
    const ops = (p.openings || []).slice().sort((u, v) => u.from - v.from);
    let cur = 0;
    const len = alongX ? bx - ax : bz - az;
    const line = (s0, s1) => s1 > s0 && s.push(alongX
      ? `<line x1="${ax + s0}" y1="${az}" x2="${ax + s1}" y2="${az}" stroke="${p.kind === 'glass' ? '#9fd3e0' : '#eee'}" stroke-width="0.08"/>`
      : `<line x1="${ax}" y1="${az + s0}" x2="${ax}" y2="${az + s1}" stroke="${p.kind === 'glass' ? '#9fd3e0' : '#eee'}" stroke-width="0.08"/>`);
    for (const o of ops) { line(cur, o.from); cur = o.to; }
    line(cur, len);
  }
  // entrée
  s.push(`<path d="M-0.15 2.2 v1.6" stroke="#a4d03c" stroke-width="0.2"/>`);
  if (full) {
    s.push(`<text x="-0.5" y="3.15" fill="#a4d03c" font-size="0.45" font-weight="700" text-anchor="end">Entrée ▶</text>`);
    for (const v of VIEWS.filter((q) => !q.cutaway)) {
      const [x, , z] = v.pos;
      s.push(`<g class="vp" data-n="${v.n}"><circle cx="${x}" cy="${z}" r="0.32" fill="#a4d03c" stroke="#12291e" stroke-width="0.06"/><text x="${x}" y="${z + 0.12}" font-size="0.32" font-weight="700" fill="#12291e" text-anchor="middle">${v.n}</text></g>`);
    }
  } else {
    for (const n of nodes) {
      if (n.pos[0] < 0 || n.pos[2] > 6 || n.pos[2] < 0) continue;
      s.push(`<circle cx="${n.pos[0]}" cy="${n.pos[2]}" r="0.12" fill="#a4d03c" opacity="0.7"/>`);
    }
  }
  const r = full ? 0.45 : 0.32;
  s.push(`<g class="me"><path class="cone" d="M0 0 L${-1.6 * r * 2.2} ${-3 * r * 2.2} A${3.4 * r * 2.2} ${3.4 * r * 2.2} 0 0 1 ${1.6 * r * 2.2} ${-3 * r * 2.2} Z" fill="#ff5a3c" opacity="0.35"/><circle r="${r}" fill="#ff5a3c" stroke="#fff" stroke-width="${r * 0.35}"/></g>`);
  s.push(`</svg>`);
  return s.join('');
}

const mini = $('#minimap');
mini.innerHTML = planSVG({ full: false }) + '<div class="out">Vous êtes à l’extérieur · touchez pour entrer</div>';
$('#plan-svg').innerHTML = planSVG({ full: true });
$('#plan-svg').addEventListener('click', (e) => {
  const g = e.target.closest('.vp');
  if (g) openView(VIEWS.find((v) => v.n === +g.dataset.n));
});
mini.addEventListener('click', (e) => {
  const svg = mini.querySelector('svg');
  if (state.mode !== 'walk') return openView(VIEWS.find((v) => v.n === 7));
  if (mini.classList.contains('outside')) return openView(VIEWS.find((v) => v.n === 6));
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const p = pt.matrixTransform(svg.getScreenCTM().inverse());
  moveTo(p.x, p.y, { yaw: state.yaw });
});

function updateMinimap() {
  const deg = (-state.yaw * 180) / Math.PI;
  const outside = state.mode === 'walk' && zoneOfPoint(state.pos.x, state.pos.z) === 'exterieur';
  mini.classList.toggle('outside', outside || state.mode !== 'walk');
  mini.querySelector('.out').textContent = state.mode !== 'walk' ? 'Maquette 3D · touchez pour entrer' : 'Vous êtes à l’extérieur · touchez pour entrer';
  for (const me of document.querySelectorAll('svg .me')) {
    me.setAttribute('transform', `translate(${state.pos.x} ${state.pos.z}) rotate(${deg})`);
    me.style.display = state.mode === 'walk' ? '' : 'none';
  }
}

// --------------------------------------------------------------- entrées
const pointers = new Map();
let down = null, pinch0 = 0, fovAtPinch = 65;
canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 1) down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 };
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinch0 = Math.hypot(a.x - b.x, a.y - b.y);
    fovAtPinch = state.fov;
    down = null;
  }
  hideHint();
});
canvas.addEventListener('pointermove', (e) => {
  const p = pointers.get(e.pointerId);
  if (!p) return;
  const dx = e.clientX - p.x, dy = e.clientY - p.y;
  p.x = e.clientX;
  p.y = e.clientY;
  if (state.mode !== 'walk' || state.anim) return;
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    state.fov = Math.min(80, Math.max(28, fovAtPinch * (pinch0 / d)));
    state.dirty = true;
    return;
  }
  if (down) down.moved += Math.abs(dx) + Math.abs(dy);
  const k = (state.fov / 65) * (mobile ? 0.0055 : 0.0042);
  state.yaw += dx * k;
  state.pitch = Math.max(-1.2, Math.min(1.2, state.pitch + dy * k));
  state.dirty = true;
});
const endPointer = (e) => {
  pointers.delete(e.pointerId);
  if (down && pointers.size === 0 && down.moved < 8 && performance.now() - down.t < 450) tap(e.clientX, e.clientY);
  if (pointers.size === 0) down = null;
};
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', (e) => pointers.delete(e.pointerId));
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  if (state.mode === 'walk') zoomBy(e.deltaY > 0 ? 1.08 : 0.93);
}, { passive: false });

const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
function tap(cx, cy) {
  if (state.mode !== 'walk' || state.anim) return;
  ndc.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hs = ray.intersectObjects(hsGroup.children, true).find((h) => h.object.userData.node);
  if (hs) return goToNode(hs.object.userData.node);
  const hit = ray.intersectObjects([hub.groups.static, hub.groups.exterior], true)[0];
  if (!hit || hit.distance > 25) return;
  const p = hit.point;
  const floor = hit.face && hit.face.normal.y > 0.7 && p.y < 0.25;
  if (floor) moveTo(p.x, p.z, { yaw: undefined, pitch: -0.05 });
  else {
    // objet touché : on s'approche à ~1,1 m et on le regarde
    const dx = p.x - state.pos.x, dz = p.z - state.pos.z, d = Math.hypot(dx, dz);
    const back = Math.min(d, 1.1);
    const tx = p.x - (dx / d) * back, tz = p.z - (dz / d) * back;
    const a = lookAngles([tx, EYE, tz], [p.x, p.y, p.z]);
    moveTo(tx, tz, { yaw: a.yaw, pitch: a.pitch * 0.7 });
  }
}

// clavier (ordinateur) : flèches / ZQSD / WASD
const keys = new Set();
addEventListener('keydown', (e) => {
  if (e.target.closest('input,textarea')) return;
  keys.add(e.key.toLowerCase());
  if (e.key === 'Escape') closeAll();
  hideHint();
});
addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
function stepKeys(dt) {
  if (state.mode !== 'walk' || state.anim || !keys.size) return;
  const f = (keys.has('arrowup') || keys.has('z') || keys.has('w') ? 1 : 0) - (keys.has('arrowdown') || keys.has('s') ? 1 : 0);
  const r = (keys.has('d') ? 1 : 0) - (keys.has('q') || keys.has('a') ? 1 : 0);
  const turn = (keys.has('arrowleft') ? 1 : 0) - (keys.has('arrowright') ? 1 : 0);
  if (!f && !r && !turn) return;
  state.yaw += turn * dt * 1.6;
  const sp = 2.2 * dt;
  const sx = -Math.sin(state.yaw), sz = -Math.cos(state.yaw);
  const nx = state.pos.x + (sx * f + -sz * r) * sp, nz = state.pos.z + (sz * f + sx * r) * sp;
  if (grid.free(nx, state.pos.z)) state.pos.x = nx;
  if (grid.free(state.pos.x, nz)) state.pos.z = nz;
  state.pos.y += (EYE - state.pos.y) * Math.min(1, dt * 3);
  state.at = null;
  state.dirty = true;
  if ((stepKeys.acc = (stepKeys.acc || 0) + dt) > 0.4) {
    stepKeys.acc = 0;
    updateHUD();
    updateHotspots();
  }
}

let hintTimer;
function hideHint() {
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => $('#hint').classList.add('hide'), 1200);
}

// --------------------------------------------------------------- boucle
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  stepAnim(now);
  stepKeys(dt);
  if (state.mode === 'orbit') orbit.update();
  if (state.dirty || state.mode === 'orbit' || state.mode === 'fly') {
    applyCamera();
    placeLabels();
    if (state.anim || keys.size) updateMinimap();
    renderer.render(scene, camera);
    state.dirty = false;
  }
  requestAnimationFrame(loop);
}

// --------------------------------------------------------------- lancement
const startN = +(location.hash.match(/vue-(\d+)/)?.[1] ?? 5);
const startView = VIEWS.find((v) => v.n === startN) || VIEWS[4];
if (startView.cutaway) enterOrbit(startView);
else {
  const a = lookAngles(startView.pos, startView.target);
  state.pos.set(...startView.pos);
  Object.assign(state, { yaw: a.yaw, pitch: a.pitch, fov: Math.max(55, startView.fov ?? 65), at: startView });
  if (startView.night) setNight(true);
}
// compile les shaders avant d'afficher
applyCamera();
renderer.compile(scene, camera);
renderer.render(scene, camera);
progress(1);
updateHUD();
updateHotspots();
requestAnimationFrame(loop);
const start = $('#start');
start.disabled = false;
start.textContent = 'Commencer la visite';
start.addEventListener('click', () => {
  $('#loader').classList.add('hide');
  setTimeout(() => $('#loader').remove(), 700);
  hintTimer = setTimeout(() => $('#hint').classList.add('hide'), 7000);
});
window.__tour = { state, grid, openView, moveTo, VIEWS };
window.__ready = true;
