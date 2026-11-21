import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    container: { center: true, padding: { DEFAULT: "1rem", lg: "2rem" }, screens: { "2xl": "1280px" } },
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans Variable"', "system-ui", "sans-serif"],
        hand: ['"Caveat"', "cursive"],
        display: ['"Anton"', "Impact", "sans-serif"],
        serif: ['"Fraunces Variable"', "Georgia", "serif"], // titres de Navilease (chargée sous /navilease seulement)
      },
      colors: {
        // Couleur de la marque en variables (globals.css) : bleu Navigoal partout, vert forêt sous Navilease (.theme-nl).
        brand: Object.fromEntries([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((n) => [n, `rgb(var(--brand-${n}) / <alpha-value>)`])),
        // Navilease : vert forêt et ocre du logo, fond crème.
        nl: { vert: "#1f4d38", vert2: "#2b6a4c", ocre: "#e9a33a", "ocre-texte": "#93570a", creme: "#f7f3ea", sable: "#efe7d6", encre: "#10231a", bord: "#e6dfcd", gris: "#5f6457" },
        sun: { 50: "#fffbea", 100: "#fff3c4", 200: "#ffe588", 300: "#ffd34a", 400: "#ffc21f", 500: "#f9a806", 600: "#dd7f02" },
        ink: { DEFAULT: "#0b1533", soft: "#3b4566", mute: "#5f6886" },
      },
      boxShadow: {
        card: "0 1px 2px rgba(11,21,51,.04), 0 8px 24px -8px rgba(11,21,51,.10)",
        lift: "0 2px 4px rgba(11,21,51,.05), 0 24px 48px -12px rgba(26,71,245,.25)",
        glow: "0 0 0 1px rgba(51,102,255,.15), 0 12px 40px -8px rgba(51,102,255,.45)",
      },
      keyframes: {
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-12px)" } },
        blob: {
          "0%,100%": { borderRadius: "42% 58% 70% 30% / 45% 45% 55% 55%" },
          "50%": { borderRadius: "70% 30% 46% 54% / 30% 39% 61% 70%" },
        },
        shimmer: { from: { backgroundPosition: "200% 0" }, to: { backgroundPosition: "-200% 0" } },
        "spin-slow": { to: { transform: "rotate(360deg)" } },
      },
      animation: {
        marquee: "marquee 40s linear infinite",
        float: "float 6s ease-in-out infinite",
        "float-late": "float 7s ease-in-out 1.5s infinite",
        blob: "blob 14s ease-in-out infinite",
        shimmer: "shimmer 6s linear infinite",
        "spin-slow": "spin-slow 30s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
