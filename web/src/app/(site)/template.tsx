// Transition d'arrivée sur chaque page publique, en CSS (.anim-page, globals.css) : le contenu est visible dès
// l'arrivée du HTML. L'ancienne version (framer-motion, opacité 0 jusqu'au JavaScript) masquait toute la page
// aux robots de Google lors de leur première lecture et retardait l'affichage sur mobile.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="anim-page">{children}</div>;
}
