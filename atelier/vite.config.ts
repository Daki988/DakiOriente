import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" : le dossier dist/ fonctionne n'importe où (hébergement statique).
export default defineConfig({ base: "./", plugins: [react()] });
