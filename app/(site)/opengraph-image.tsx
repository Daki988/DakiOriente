import { ImageResponse } from "next/og";

export const alt = "JACKBOY — Feel the night · Libreville";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 72, color: "#f3efe6", backgroundColor: "#0a0c0b",
        backgroundImage: "radial-gradient(circle at 85% 10%, rgba(140,198,63,0.35), rgba(10,12,11,0) 55%), radial-gradient(circle at 0% 100%, rgba(14,58,44,1), rgba(10,12,11,0) 60%)" }}>
        <div style={{ fontSize: 26, letterSpacing: 10, color: "#8cc63f" }}>FEEL THE NIGHT · LIBREVILLE</div>
        <div style={{ fontSize: 150, fontWeight: 900, lineHeight: 1 }}>JACKBOY</div>
        <div style={{ fontSize: 44, marginTop: 8 }}>BAR-RESTAURANT 241</div>
        <div style={{ fontSize: 32, marginTop: 24, color: "#d2a84e" }}>La nuit a son adresse.</div>
      </div>
    ),
    size,
  );
}
