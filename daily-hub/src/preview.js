import { createStage } from './model/stage.js';
import { VIEWS } from './model/views.js';

const q = new URLSearchParams(location.search);
const w = +(q.get('w') || 1600), h = +(q.get('h') || 1000);
const stage = createStage(document.getElementById('c'), { quality: q.get('q') || 'high', preserveDrawingBuffer: true });
stage.resize(w, h, 1);

window.renderView = (n) => {
  const v = VIEWS.find((x) => x.n === n);
  stage.setView(v);
  stage.render();
  stage.render();
  return v.id;
};
window.renderView(+(q.get('view') || 7));
window.__ready = true;
