"use client";
import { useEffect } from "react";

/** Passe aussi <html> au thème Navilease : les fenêtres (filtres, galerie, carte) s'ouvrent hors de la page. */
export function ThemeNavilease() {
  useEffect(() => {
    document.documentElement.classList.add("theme-nl");
    return () => document.documentElement.classList.remove("theme-nl");
  }, []);
  return null;
}
