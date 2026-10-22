// Marionnette 2D : l'image est posée sur un maillage fin, chaque sommet suit un squelette
// (rotation de chaque os autour de son articulation, mélange pondéré par la distance).

// Rigs en coordonnées de l'image détourée. seg = [x1, y1, x2, y2, épaisseur]
export const RIGS = {
  pouce: {
    src: 'hd-pouce.png', pad: 0.12,
    bones: {
      root: { parent: null, pivot: [690, 760], segs: [[690, 820, 710, 570, 60]] },
      head: { parent: 'root', pivot: [720, 585], segs: [[760, 520, 900, 380, 120], [640, 260, 1150, 300, 40]] },
      tail1: { parent: 'head', pivot: [560, 300], segs: [[540, 280, 430, 140, 40]] },
      tail2: { parent: 'tail1', pivot: [430, 140], segs: [[430, 140, 260, 70, 40]] },
      tail3: { parent: 'tail2', pivot: [260, 70], segs: [[260, 70, 150, 240, 40]] },
      armL: { parent: 'root', pivot: [610, 580], segs: [[600, 570, 450, 545, 30]] },
      handL: { parent: 'armL', pivot: [450, 545], segs: [[420, 560, 200, 570, 70], [300, 500, 310, 320, 25]] },
      armR: { parent: 'root', pivot: [790, 690], segs: [[790, 690, 950, 730, 30]] },
      handR: { parent: 'armR', pivot: [960, 730], segs: [[960, 730, 1060, 700, 60], [1060, 650, 1220, 610, 25]] },
      rib1: { parent: 'root', pivot: [560, 770], segs: [[540, 770, 360, 720, 25]] },
      rib2: { parent: 'rib1', pivot: [360, 720], segs: [[360, 720, 190, 770, 25]] },
      thighB: { parent: 'root', pivot: [620, 830], segs: [[610, 830, 450, 860, 25]] },
      shoeB: { parent: 'thighB', pivot: [450, 860], segs: [[420, 860, 240, 960, 70]] },
      thighF: { parent: 'root', pivot: [690, 830], segs: [[690, 830, 750, 940, 25]] },
      shoeF: { parent: 'thighF', pivot: [760, 950], segs: [[760, 960, 1000, 1040, 80]] },
    },
    eyes: [[735, 420, 85, 60], [915, 470, 85, 60]],
  },
  courses: {
    src: 'hd-courses.png', pad: 0.12,
    bones: {
      root: { parent: null, pivot: [700, 720], segs: [[700, 780, 720, 560, 70]] },
      head: { parent: 'root', pivot: [720, 570], segs: [[780, 480, 900, 350, 130], [600, 180, 1120, 260, 40]] },
      tail1: { parent: 'head', pivot: [570, 280], segs: [[560, 270, 420, 130, 40]] },
      tail2: { parent: 'tail1', pivot: [420, 130], segs: [[420, 130, 270, 60, 40]] },
      tail3: { parent: 'tail2', pivot: [270, 60], segs: [[270, 60, 210, 240, 40]] },
      pack: { parent: 'root', pivot: [600, 430], segs: [[300, 470, 100, 500, 150]] },
      armL: { parent: 'root', pivot: [640, 610], segs: [[640, 610, 540, 640, 25]] },
      handL: { parent: 'armL', pivot: [540, 640], segs: [[520, 620, 380, 640, 60], [465, 560, 455, 430, 30]] },
      armR: { parent: 'root', pivot: [790, 650], segs: [[790, 650, 940, 650, 30]] },
      grocery: { parent: 'armR', pivot: [950, 650], segs: [[1000, 700, 1250, 760, 150], [1050, 500, 1250, 450, 60]] },
      thighB: { parent: 'root', pivot: [600, 780], segs: [[600, 780, 430, 790, 25]] },
      shoeB: { parent: 'thighB', pivot: [430, 790], segs: [[400, 820, 290, 920, 70]] },
      thighF: { parent: 'root', pivot: [700, 800], segs: [[700, 800, 780, 880, 25]] },
      shoeF: { parent: 'thighF', pivot: [780, 900], segs: [[760, 980, 960, 940, 80]] },
    },
    eyes: [[775, 355, 75, 52], [945, 420, 70, 52]],
  },
  scooter: {
    src: 'hd-scooter.png', pad: 0.08,
    bones: {
      ground: { parent: null, pivot: [600, 1100], segs: [[240, 1070, 240, 1070, 115], [965, 1070, 965, 1070, 120]] },
      chassis: { parent: null, pivot: [600, 900], segs: [[150, 820, 1050, 820, 80], [330, 990, 800, 990, 40], [600, 560, 1000, 560, 40], [480, 650, 620, 900, 60]] },
      body: { parent: 'chassis', pivot: [560, 640], segs: [[560, 620, 560, 440, 60]] },
      head: { parent: 'body', pivot: [600, 420], segs: [[640, 330, 720, 260, 110], [450, 120, 900, 160, 40]] },
      tail1: { parent: 'head', pivot: [470, 240], segs: [[470, 240, 340, 70, 35]] },
      tail2: { parent: 'tail1', pivot: [340, 70], segs: [[340, 70, 120, 60, 35]] },
      tail3: { parent: 'tail2', pivot: [120, 60], segs: [[120, 60, 50, 230, 35]] },
      tail4: { parent: 'tail3', pivot: [60, 240], segs: [[60, 250, 260, 320, 30]] },
      armL: { parent: 'body', pivot: [520, 450], segs: [[520, 450, 420, 420, 25]] },
      handL: { parent: 'armL', pivot: [420, 420], segs: [[430, 410, 320, 420, 50], [420, 340, 430, 260, 25]] },
      box: { parent: 'chassis', pivot: [270, 640], segs: [[150, 450, 150, 600, 110]] },
    },
    eyes: [[650, 265, 62, 45], [775, 300, 58, 45]],
  },
};

const VS = `#version 300 es
in vec2 p; in vec2 uv; uniform vec2 sz; out vec2 v;
void main(){ v = uv; gl_Position = vec4(p.x / sz.x * 2. - 1., 1. - p.y / sz.y * 2., 0, 1); }`;
const FS = `#version 300 es
precision highp float; in vec2 v; uniform sampler2D t; out vec4 o;
void main(){ o = texture(t, v); }`;

function segDist(x, y, s) {
  const [x1, y1, x2, y2, r] = s, dx = x2 - x1, dy = y2 - y1, L = dx * dx + dy * dy;
  const k = L ? Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / L)) : 0;
  return Math.max(0, Math.hypot(x - x1 - k * dx, y - y1 - k * dy) - r);
}

export async function createPuppet(canvas, rig, displayWidth) {
  const img = new Image(); img.src = rig.src; await img.decode();
  const W = img.width, H = img.height, px = W * rig.pad, py = H * rig.pad;
  const scale = displayWidth / W;
  canvas.width = Math.round((W + 2 * px) * scale); canvas.height = Math.round((H + 2 * py) * scale);
  canvas.style.width = canvas.width + 'px'; canvas.style.height = canvas.height + 'px';
  // la position CSS de l'image d'origine reste la même : le canevas déborde de la marge
  canvas.style.marginLeft = -px * scale + 'px'; canvas.style.marginTop = -py * scale + 'px';

  const gl = canvas.getContext('webgl2', { premultipliedAlpha: true, preserveDrawingBuffer: true, antialias: true });
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog); gl.useProgram(prog);
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  for (const p of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T]) gl.texParameteri(gl.TEXTURE_2D, p, gl.CLAMP_TO_EDGE);
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  // maillage
  const cell = 12, nx = Math.ceil(W / cell), ny = Math.ceil(H / cell);
  const names = Object.keys(rig.bones), B = names.length;
  const rest = new Float32Array((nx + 1) * (ny + 1) * 2), uvs = new Float32Array(rest.length);
  const wts = new Float32Array((nx + 1) * (ny + 1) * B);
  let i = 0;
  for (let y = 0; y <= ny; y++) for (let x = 0; x <= nx; x++, i++) {
    const X = Math.min(W, x * cell), Y = Math.min(H, y * cell);
    rest[i * 2] = X; rest[i * 2 + 1] = Y; uvs[i * 2] = X / W; uvs[i * 2 + 1] = Y / H;
    let sum = 0;
    names.forEach((n, b) => { const d = Math.min(...rig.bones[n].segs.map((s) => segDist(X, Y, s))); const w = 1 / Math.pow(d * d + 400, 2); wts[i * B + b] = w; sum += w });
    for (let b = 0; b < B; b++) wts[i * B + b] /= sum;
  }
  const idx = [];
  for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) { const a = y * (nx + 1) + x, b = a + 1, c = a + nx + 1, d = c + 1; idx.push(a, b, c, b, d, c) }
  const pos = new Float32Array(rest.length);
  const vb = gl.createBuffer(), ub = gl.createBuffer(), ib = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, ub); gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
  const lu = gl.getAttribLocation(prog, 'uv'); gl.enableVertexAttribArray(lu); gl.vertexAttribPointer(lu, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(idx), gl.STATIC_DRAW);
  const lp = gl.getAttribLocation(prog, 'p');
  gl.uniform2f(gl.getUniformLocation(prog, 'sz'), W + 2 * px, H + 2 * py);
  gl.viewport(0, 0, canvas.width, canvas.height);

  // pose = { angles: {os: degrés}, move: {os: [dx, dy]}, blink: 0..1 }
  return function draw(pose = {}) {
    const M = {};
    for (const n of names) {
      const bone = rig.bones[n], [cx, cy] = bone.pivot, a = ((pose.angles?.[n] || 0) * Math.PI) / 180;
      const [dx, dy] = pose.move?.[n] || [0, 0];
      const c = Math.cos(a), s = Math.sin(a);
      // local = translate(d) · rotate autour du pivot
      const L = [c, -s, cx - c * cx + s * cy + dx, s, c, cy - s * cx - c * cy + dy];
      const P = bone.parent ? M[bone.parent] : [1, 0, 0, 0, 1, 0];
      M[n] = [P[0] * L[0] + P[1] * L[3], P[0] * L[1] + P[1] * L[4], P[0] * L[2] + P[1] * L[5] + P[2], P[3] * L[0] + P[4] * L[3], P[3] * L[1] + P[4] * L[4], P[3] * L[2] + P[4] * L[5] + P[5]];
    }
    const mats = names.map((n) => M[n]), blink = pose.blink || 0;
    const N = rest.length / 2;
    for (let v = 0; v < N; v++) {
      let x = rest[v * 2], y = rest[v * 2 + 1];
      if (blink) for (const [ex, ey, rx, ry] of rig.eyes) {
        const q = ((x - ex) / rx) ** 2 + ((y - ey) / ry) ** 2;
        if (q < 2.4) { const f = q < 1 ? 1 : 1 - (q - 1) / 1.4; y = ey + (y - ey) * (1 - 0.85 * blink * f) }
      }
      let ox = 0, oy = 0;
      for (let b = 0; b < B; b++) { const w = wts[v * B + b]; if (w < 1e-4) continue; const m = mats[b]; ox += w * (m[0] * x + m[1] * y + m[2]); oy += w * (m[3] * x + m[4] * y + m[5]) }
      pos[v * 2] = ox + px; pos[v * 2 + 1] = oy + py;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, pos, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_INT, 0);
  };
}

// Mouvements : course (pouce, courses) et conduite (scooter)
const S = Math.sin, TAU = Math.PI * 2;
const blinkAt = (t, period = 3.2, off = 0) => { const k = ((t + off) % period) / 0.18; return k < 1 ? Math.sin(k * Math.PI) : 0 };
export const MOVES = {
  run(t, speed = 1.5, off = 0) {
    const w = TAU * speed * t;
    return {
      angles: {
        root: 3 * S(w * 2), head: 4 * S(w + 1) - 2, tail1: 5 * S(TAU * 0.9 * t), tail2: 9 * S(TAU * 0.9 * t - 0.9), tail3: 14 * S(TAU * 0.9 * t - 1.8),
        armL: 10 * S(w), handL: 8 * S(w - 0.7), armR: -9 * S(w), handR: 7 * S(w - 0.7), pack: 2.5 * S(w * 2 - 0.5), grocery: 6 * S(w - 1.2),
        rib1: 8 * S(TAU * 1.1 * t), rib2: 14 * S(TAU * 1.1 * t - 1),
        thighB: 14 * S(w), shoeB: 12 * S(w - 0.9), thighF: -14 * S(w), shoeF: -12 * S(w - 0.9),
      },
      move: { root: [0, -16 * Math.abs(S(w))] },
      blink: blinkAt(t, 3.2, off),
    };
  },
  ride(t) {
    const w = TAU * 1.2 * t, bump = S(TAU * 3.1 * t) * 0.6 + S(TAU * 1.7 * t) * 0.4;
    return {
      angles: { body: 2 * S(w), head: 3 * S(w + 0.8), tail1: 6 * S(TAU * 0.8 * t), tail2: 10 * S(TAU * 0.8 * t - 0.9), tail3: 14 * S(TAU * 0.8 * t - 1.8), tail4: 16 * S(TAU * 0.8 * t - 2.6), armL: 8 * S(w * 1.5), handL: 10 * S(w * 1.5 - 0.7), box: 1.2 * S(TAU * 3.1 * t + 1) },
      move: { chassis: [0, bump * 7], body: [0, S(TAU * 3.1 * t + 0.6) * 5] },
      blink: blinkAt(t, 2.8, 1.1),
    };
  },
};
