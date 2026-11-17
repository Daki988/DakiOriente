import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Neam Transit",
    short_name: "Neam Transit",
    description: "Comparez les transitaires vérifiés Chine / Corée du Sud → Gabon",
    start_url: "/",
    display: "standalone",
    background_color: "#f3f7fc",
    theme_color: "#0b2545",
    lang: "fr",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
