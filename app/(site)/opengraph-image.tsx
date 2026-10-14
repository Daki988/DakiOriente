import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Jackboy Bar-Resto 241 — Bar, fast food & chicha à Libreville (Louis)";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  const logo = await readFile(join(process.cwd(), "public/brand/logo-dark.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", padding: 64, gap: 56, color: "#f3efe6", backgroundColor: "#0a0c0b",
        backgroundImage: "radial-gradient(circle at 85% 15%, rgba(22,180,127,0.35), rgba(10,12,11,0) 55%), radial-gradient(circle at 0% 100%, rgba(11,58,46,1), rgba(10,12,11,0) 60%)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={330} height={317} alt="" />
        <div style={{ display: "flex", flexDirection: "column", flex: 1, maxWidth: 660 }}>
          <div style={{ fontSize: 26, letterSpacing: 8, color: "#16b47f" }}>FEEL THE NIGHT · LIBREVILLE</div>
          <div style={{ fontSize: 60, fontWeight: 800, lineHeight: 1.1, marginTop: 16, display: "flex", flexWrap: "wrap" }}>Bar · Fast food gourmet · Chicha</div>
          <div style={{ fontSize: 28, marginTop: 20, color: "#a9b0a8", display: "flex", flexWrap: "wrap" }}>Louis, Libreville · à 100 m de l&apos;ambassade de Côte d&apos;Ivoire · Tous les jours dès 15 h</div>
          <div style={{ fontSize: 40, marginTop: 28, color: "#d2a84e" }}>La nuit a son adresse.</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
