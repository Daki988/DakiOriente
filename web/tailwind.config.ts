import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    container: { center: true, padding: { DEFAULT: "1rem", lg: "2rem" }, screens: { "2xl": "1280px" } },
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans Variable"', "system-ui", "sans-serif"],
        hand: ['"Caveat"', "cursive"],
      },
      colors: {
        brand: {
          50: "#eef4ff", 100: "#dae6ff", 200: "#bcd2ff", 300: "#8eb4ff", 400: "#598bff",
          500: "#3366ff", 600: "#1a47f5", 700: "#1336e0", 800: "#162fb5", 900: "#182e8f", 950: "#0b1a4f",
        },
        sun: { 50: "#fffbea", 100: "#fff3c4", 200: "#ffe588", 300: "#ffd34a", 400: "#ffc21f", 500: "#f9a806", 600: "#dd7f02" },
        ink: { DEFAULT: "#0b1533", soft: "#3b4566", mute: "#6b7493" },
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
