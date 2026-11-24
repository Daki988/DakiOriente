import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // le moteur d'adressage vit dans ../src
  server: { fs: { allow: [".."] } },
});
