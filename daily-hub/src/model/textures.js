// Textures procédurales (canvas) : aucun fichier image à charger,
// donc rien de lourd à télécharger sur mobile.
import * as THREE from 'three';

export const PALETTE = {
  forest: '#1f4a36',
  forestDark: '#163626',
  lime: '#a4d03c',
  wood: '#b98552',
  woodLight: '#d2a271',
  metal: '#1b1b1b',
  wall: '#efe9df',
  warm: '#ffd59a',
};

function canvasTexture(w, h, draw, { repeat = [1, 1], srgb = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = 4;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const rand = (() => {
  let s = 7;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
})();

// Carrelage 60×60 : une texture = 1,2 m (2×2 carreaux)
export function tileTexture(base = '#d9d2c5', joint = '#b9b0a2') {
  return canvasTexture(512, 512, (g, w, h) => {
    g.fillStyle = joint;
    g.fillRect(0, 0, w, h);
    const n = 2, s = w / n;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        const v = (rand() - 0.5) * 10;
        g.fillStyle = shade(base, v);
        g.fillRect(i * s + 2, j * s + 2, s - 4, s - 4);
        for (let k = 0; k < 120; k++) {
          g.fillStyle = `rgba(0,0,0,${rand() * 0.04})`;
          g.fillRect(i * s + rand() * s, j * s + rand() * s, 3, 3);
        }
      }
  });
}

// Parquet chêne : lames de 18 cm, une texture = 1,44 m
export function woodFloorTexture() {
  return canvasTexture(512, 512, (g, w, h) => {
    const rows = 8, rh = h / rows;
    for (let r = 0; r < rows; r++) {
      let x = -rand() * 200;
      while (x < w) {
        const len = 160 + rand() * 200;
        g.fillStyle = shade('#b07a48', (rand() - 0.5) * 30);
        g.fillRect(x, r * rh, len, rh);
        for (let k = 0; k < 6; k++) {
          g.strokeStyle = `rgba(60,30,10,${0.08 + rand() * 0.08})`;
          g.beginPath();
          const y = r * rh + rand() * rh;
          g.moveTo(x, y);
          g.bezierCurveTo(x + len / 3, y + 3, x + (2 * len) / 3, y - 3, x + len, y);
          g.stroke();
        }
        g.fillStyle = 'rgba(40,20,5,0.5)';
        g.fillRect(x, r * rh, 2, rh);
        x += len;
      }
      g.fillStyle = 'rgba(40,20,5,0.45)';
      g.fillRect(0, r * rh, w, 2);
    }
  });
}

// Bois des tasseaux et comptoirs
export function woodTexture(base = PALETTE.wood) {
  return canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    for (let k = 0; k < 60; k++) {
      g.strokeStyle = `rgba(70,35,10,${0.05 + rand() * 0.1})`;
      g.lineWidth = 1 + rand() * 2;
      g.beginPath();
      const x = rand() * w;
      g.moveTo(x, 0);
      g.bezierCurveTo(x + 6, h / 3, x - 6, (2 * h) / 3, x + 3, h);
      g.stroke();
    }
  });
}

export function concreteTexture() {
  return canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#9d9d98';
    g.fillRect(0, 0, w, h);
    for (let k = 0; k < 3000; k++) {
      g.fillStyle = `rgba(${rand() > 0.5 ? 255 : 0},${rand() > 0.5 ? 255 : 0},${rand() > 0.5 ? 255 : 0},0.03)`;
      g.fillRect(rand() * w, rand() * h, 2, 2);
    }
  });
}

export function asphaltTexture() {
  return canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#3d3f42';
    g.fillRect(0, 0, w, h);
    for (let k = 0; k < 4000; k++) {
      const v = Math.floor(rand() * 90);
      g.fillStyle = `rgba(${v + 60},${v + 60},${v + 60},0.25)`;
      g.fillRect(rand() * w, rand() * h, 1.5, 1.5);
    }
  });
}

export function grassTexture() {
  return canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#4f7a34';
    g.fillRect(0, 0, w, h);
    for (let k = 0; k < 5000; k++) {
      g.fillStyle = shade('#4f7a34', (rand() - 0.5) * 60);
      g.fillRect(rand() * w, rand() * h, 1, 3);
    }
  });
}

// Pictogrammes vectoriels simples dessinés au canvas
const ICONS = {
  cart(g, s) {
    g.beginPath();
    g.moveTo(-0.45 * s, -0.35 * s);
    g.lineTo(-0.3 * s, -0.35 * s);
    g.lineTo(-0.15 * s, 0.2 * s);
    g.lineTo(0.35 * s, 0.2 * s);
    g.lineTo(0.45 * s, -0.2 * s);
    g.lineTo(-0.22 * s, -0.2 * s);
    g.stroke();
    g.beginPath();
    g.arc(-0.08 * s, 0.38 * s, 0.07 * s, 0, 7);
    g.arc(0.3 * s, 0.38 * s, 0.07 * s, 0, 7);
    g.fill();
  },
  cup(g, s) {
    g.strokeRect(-0.35 * s, -0.15 * s, 0.55 * s, 0.5 * s);
    g.beginPath();
    g.arc(0.25 * s, 0.08 * s, 0.13 * s, -1.5, 1.5);
    g.stroke();
    for (const dx of [-0.2, -0.05, 0.1]) {
      g.beginPath();
      g.moveTo(dx * s, -0.25 * s);
      g.quadraticCurveTo((dx + 0.06) * s, -0.35 * s, dx * s, -0.45 * s);
      g.stroke();
    }
  },
  washer(g, s) {
    g.strokeRect(-0.38 * s, -0.42 * s, 0.76 * s, 0.84 * s);
    g.beginPath();
    g.arc(0, 0.06 * s, 0.24 * s, 0, 7);
    g.stroke();
    g.beginPath();
    g.moveTo(-0.38 * s, -0.24 * s);
    g.lineTo(0.38 * s, -0.24 * s);
    g.stroke();
  },
  man(g, s) {
    g.beginPath();
    g.arc(0, -0.32 * s, 0.1 * s, 0, 7);
    g.fill();
    g.fillRect(-0.14 * s, -0.18 * s, 0.28 * s, 0.6 * s);
  },
  woman(g, s) {
    g.beginPath();
    g.arc(0, -0.32 * s, 0.1 * s, 0, 7);
    g.fill();
    g.beginPath();
    g.moveTo(0, -0.2 * s);
    g.lineTo(0.22 * s, 0.25 * s);
    g.lineTo(-0.22 * s, 0.25 * s);
    g.fill();
    g.fillRect(-0.1 * s, 0.25 * s, 0.2 * s, 0.18 * s);
  },
  hanger(g, s) {
    g.beginPath();
    g.moveTo(-0.4 * s, 0.25 * s);
    g.lineTo(0, -0.05 * s);
    g.lineTo(0.4 * s, 0.25 * s);
    g.closePath();
    g.stroke();
    g.beginPath();
    g.arc(0, -0.18 * s, 0.1 * s, Math.PI, 2.4 * Math.PI);
    g.stroke();
  },
  basket(g, s) {
    g.beginPath();
    g.moveTo(-0.4 * s, -0.1 * s);
    g.lineTo(0.4 * s, -0.1 * s);
    g.lineTo(0.3 * s, 0.35 * s);
    g.lineTo(-0.3 * s, 0.35 * s);
    g.closePath();
    g.stroke();
    g.beginPath();
    g.arc(0, -0.1 * s, 0.25 * s, Math.PI, 0);
    g.stroke();
  },
};

// Panneau de signalétique : fond vert forêt, texte blanc, pictogramme lime
export function signTexture(text, { icon, sub, w = 1024, h = 256, bg = PALETTE.forest, align = 'center' } = {}) {
  return canvasTexture(
    w,
    h,
    (g) => {
      g.fillStyle = bg;
      g.fillRect(0, 0, w, h);
      let x = align === 'center' ? w / 2 : h * 0.25;
      if (icon && ICONS[icon]) {
        g.save();
        const s = h * 0.62;
        const ix = align === 'center' ? w / 2 - measure(g, text, h) / 2 - s * 0.55 : h * 0.6;
        g.translate(ix, h / 2);
        g.strokeStyle = g.fillStyle = PALETTE.lime;
        g.lineWidth = h * 0.045;
        g.lineJoin = g.lineCap = 'round';
        ICONS[icon](g, s);
        g.restore();
        if (align === 'center') x += s * 0.5;
        else x = h * 1.1;
      }
      g.fillStyle = '#ffffff';
      g.textAlign = align === 'center' ? 'center' : 'left';
      g.textBaseline = 'middle';
      g.font = `700 ${Math.round(h * (sub ? 0.4 : 0.48))}px "Poppins","Montserrat","Helvetica Neue",Arial,sans-serif`;
      g.fillText(text, x, sub ? h * 0.4 : h / 2);
      if (sub) {
        g.fillStyle = PALETTE.lime;
        g.font = `500 ${Math.round(h * 0.2)}px "Poppins","Helvetica Neue",Arial,sans-serif`;
        g.fillText(sub, x, h * 0.75);
      }
    },
    {},
  );
}

function measure(g, text, h) {
  g.font = `700 ${Math.round(h * 0.48)}px "Poppins","Helvetica Neue",Arial,sans-serif`;
  return g.measureText(text).width;
}

// Tableau menu du café (ardoise)
export function menuBoardTexture(title, lines) {
  return canvasTexture(512, 384, (g, w, h) => {
    g.fillStyle = '#151a17';
    g.fillRect(0, 0, w, h);
    g.fillStyle = PALETTE.lime;
    g.font = '700 46px "Poppins",Arial,sans-serif';
    g.textAlign = 'center';
    g.fillText(title, w / 2, 62);
    g.font = '400 28px "Poppins",Arial,sans-serif';
    g.textAlign = 'left';
    lines.forEach(([l, p], i) => {
      g.fillStyle = '#f2efe8';
      g.fillText(l, 36, 120 + i * 48);
      g.textAlign = 'right';
      g.fillText(p, w - 36, 120 + i * 48);
      g.textAlign = 'left';
    });
  });
}

// Tapis d'entrée au logo
export function matTexture() {
  return canvasTexture(512, 320, (g, w, h) => {
    g.fillStyle = '#222';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = PALETTE.lime;
    g.lineWidth = 10;
    g.lineJoin = g.lineCap = 'round';
    g.save();
    g.translate(w / 2 - 120, h / 2);
    ICONS.cart(g, 120);
    g.restore();
    g.fillStyle = '#fff';
    g.font = '700 64px "Poppins",Arial,sans-serif';
    g.textBaseline = 'middle';
    g.fillText('Daily Hub', w / 2 - 50, h / 2 - 14);
    g.font = '400 28px "Poppins",Arial,sans-serif';
    g.fillStyle = PALETTE.lime;
    g.fillText('Concept Store', w / 2 - 48, h / 2 + 40);
  });
}

// Écran borne / caisse
export function screenTexture(label) {
  return canvasTexture(256, 192, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, w, h);
    grd.addColorStop(0, '#1f4a36');
    grd.addColorStop(1, '#2f7a52');
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#fff';
    g.font = '700 30px Arial';
    g.textAlign = 'center';
    g.fillText(label, w / 2, 60);
    for (let i = 0; i < 3; i++) {
      g.fillStyle = i === 0 ? PALETTE.lime : 'rgba(255,255,255,0.85)';
      g.fillRect(30, 90 + i * 32, w - 60, 22);
    }
  });
}

export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, v + amt));
  return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`;
}
