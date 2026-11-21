// Navilease : identité propre (maquettes design/maquettes/navilease_refonte.py, validées le 21/11/2026) : vert forêt et
// ocre du logo sur fond crème, titres en Fraunces (chargée ici seulement), couleur de la marque passée au vert.
import "@fontsource-variable/fraunces/opsz.css";
import "@fontsource-variable/fraunces/opsz-italic.css";
import { ThemeNavilease } from "@/components/navilease/Theme";

export default function NavileaseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-nl nl-site min-h-[60vh] bg-nl-creme pb-20">
      <ThemeNavilease />
      {children}
    </div>
  );
}
