// Mise en scène commune : moteur de rendu, ciel, soleil, environnement.
// Utilisée par la visite, les rendus des 33 vues et le film.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildDailyHub } from './build.js';

function skyTexture(night) {
  const c = document.createElement('canvas');
  c.width = 16;
  c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 256);
  if (night) {
    grd.addColorStop(0, '#060b1a');
    grd.addColorStop(0.5, '#132347');
    grd.addColorStop(1, '#2b2f4a');
  } else {
    grd.addColorStop(0, '#5f9ad8');
    grd.addColorStop(0.5, '#a9cdf0');
    grd.addColorStop(1, '#f3e7d3');
  }
  g.fillStyle = grd;
  g.fillRect(0, 0, 16, 256);
  const t = new THREE.CanvasTexture(c);
  t.mapping = THREE.EquirectangularReflectionMapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createStage(canvas, { quality = 'high', preserveDrawingBuffer = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: quality !== 'low', preserveDrawingBuffer, powerPreference: 'high-performance' });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = quality !== 'low';
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;

  const sky = { day: skyTexture(false), night: skyTexture(true) };
  scene.background = sky.day;

  const hemi = new THREE.HemisphereLight('#dfefff', '#8a7a62', 0.9);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff3df', 2.6);
  sun.position.set(-14, 22, 18);
  sun.target.position.set(10, 0, 3);
  sun.castShadow = quality !== 'low';
  const sz = quality === 'high' ? 4096 : 2048;
  sun.shadow.mapSize.set(sz, sz);
  Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 70 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);

  const hub = buildDailyHub();
  scene.add(hub.root);

  const camera = new THREE.PerspectiveCamera(60, 16 / 10, 0.05, 300);

  const setNight = (night) => {
    scene.background = night ? sky.night : sky.day;
    hemi.intensity = night ? 0.12 : 0.9;
    sun.intensity = night ? 0.0 : 2.6;
    scene.environmentIntensity = night ? 0.25 : 0.55;
    renderer.toneMappingExposure = night ? 1.15 : 1.0;
    hub.dayNight(night);
  };
  const setCutaway = (on) => {
    hub.groups.ceiling.visible = !on;
    hub.groups.roof.visible = !on;
  };

  const setView = (v) => {
    camera.fov = v.fov ?? 60;
    camera.position.set(...v.pos);
    camera.lookAt(...v.target);
    camera.updateProjectionMatrix();
    setNight(!!v.night);
    setCutaway(!!v.cutaway);
  };

  const resize = (w, h, dpr = 1) => {
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

  return { renderer, scene, camera, hub, sun, setNight, setCutaway, setView, resize, render: () => renderer.render(scene, camera) };
}
