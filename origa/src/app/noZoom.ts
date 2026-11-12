/**
 * Zoom de la page bloqué sur le web mobile et dans l'application (APK, iOS) : pincement, double appui et
 * Ctrl + molette / pincement du pavé tactile. La balise viewport suffit sur Android ; iOS et Safari l'ignorent,
 * d'où ces gestionnaires. La carte des fermes garde son propre zoom (Leaflet gère ses gestes lui-même).
 */
const inMap = (t: EventTarget | null) => t instanceof Element && !!t.closest('.leaflet-container');

export function blockPageZoom() {
  if (typeof document === 'undefined') return;
  // Safari (iOS et macOS) : événements de geste propres au pincement.
  for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
    document.addEventListener(type, (e) => { if (!inMap(e.target)) e.preventDefault(); }, { passive: false });
  }
  // Pincement à deux doigts.
  document.addEventListener('touchmove', (e) => { if (e.touches.length > 1 && !inMap(e.target)) e.preventDefault(); }, { passive: false });
  // Double appui rapide (zoom de Safari iOS).
  let last = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    // Jamais sur un bouton ou un champ : deux appuis rapides sur « + » doivent compter deux fois.
    const interactive = e.target instanceof Element && !!e.target.closest('button, a, input, select, textarea, label, [role="button"]');
    if (now - last < 300 && !inMap(e.target) && !interactive) e.preventDefault();
    last = now;
  }, { passive: false });
  // Ctrl + molette, et pincement du pavé tactile (navigateurs de bureau).
  document.addEventListener('wheel', (e) => { if (e.ctrlKey && !inMap(e.target)) e.preventDefault(); }, { passive: false });
}
