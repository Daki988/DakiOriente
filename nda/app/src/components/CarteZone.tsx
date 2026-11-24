import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Point } from "../../../src/index.ts";

const icone = L.divIcon({ className: "", html: '<div class="epingle"></div>', iconSize: [22, 22], iconAnchor: [11, 11] });

/** Carte OpenStreetMap : un toucher ou un glisser de l'épingle déplace la position. */
export function CarteZone({ position, onChange }: { position: Point; onChange: (p: Point) => void }) {
  const conteneur = useRef<HTMLDivElement>(null);
  const carte = useRef<L.Map | null>(null);
  const marqueur = useRef<L.Marker | null>(null);
  const rappel = useRef(onChange);
  rappel.current = onChange;

  useEffect(() => {
    if (!conteneur.current) return;
    const m = L.map(conteneur.current, { zoomControl: false, attributionControl: true }).setView([position.lat, position.lon], 17);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    }).addTo(m);
    const mk = L.marker([position.lat, position.lon], { icon: icone, draggable: true, keyboard: true, title: "Ma porte" }).addTo(m);
    mk.on("dragend", () => {
      const { lat, lng } = mk.getLatLng();
      rappel.current({ lat, lon: lng });
    });
    m.on("click", (e: L.LeafletMouseEvent) => rappel.current({ lat: e.latlng.lat, lon: e.latlng.lng }));
    carte.current = m;
    marqueur.current = mk;
    return () => {
      m.remove();
    };
    // la carte n'est créée qu'une fois ; les mises à jour passent par l'effet suivant
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const ll = L.latLng(position.lat, position.lon);
    marqueur.current?.setLatLng(ll);
    carte.current?.panTo(ll);
  }, [position.lat, position.lon]);

  return <div ref={conteneur} style={{ height: "100%" }} aria-label="Carte : touche pour placer ta porte" />;
}
