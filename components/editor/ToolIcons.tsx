type P = { className?: string };
const base = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
const I = (d: React.ReactNode) => function Icon({ className = "size-6" }: P) {
  return <svg viewBox="0 0 24 24" className={className} {...base}>{d}</svg>;
};

/** Pictogrammes de la barre d'outils de l'éditeur. */
export const MenuIcon = I(<><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></>);
export const TrashIcon = I(<><path d="M4 7h16" /><path d="M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13" /><path d="M9 7V4h6v3" /></>);
export const UndoIcon = I(<><path d="M9 14 4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 0 10h-3" /></>);
export const RedoIcon = I(<><path d="m15 14 5-5-5-5" /><path d="M20 9H9a5 5 0 0 0 0 10h3" /></>);
export const ZoomInIcon = I(<><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /><path d="M11 8v6M8 11h6" /></>);
export const ZoomOutIcon = I(<><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /><path d="M8 11h6" /></>);
export const DotsIcon = I(<><circle cx="5" cy="12" r="1.2" fill="currentColor" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /><circle cx="19" cy="12" r="1.2" fill="currentColor" /></>);
export const CubeIcon = I(<><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9Z" /><path d="m4 7.5 8 4.5 8-4.5" /><path d="M12 12v9" /></>);
export const CartIcon = I(<><circle cx="9" cy="20" r="1.4" /><circle cx="17" cy="20" r="1.4" /><path d="M3 4h2l2.4 11h10.2L20 8H6.2" /></>);
export const CloseIcon = I(<><path d="M6 6l12 12M18 6 6 18" /></>);
export const TextIcon = I(<><path d="M5 6V4h14v2" /><path d="M12 4v16" /><path d="M9 20h6" /></>);
export const ImageIcon = I(<><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="m21 17-5-5-9 8" /></>);
export const TemplatesIcon = I(<><rect x="3" y="3" width="8" height="10" rx="1.5" /><rect x="13" y="3" width="8" height="6" rx="1.5" /><rect x="13" y="11" width="8" height="10" rx="1.5" /><rect x="3" y="15" width="8" height="6" rx="1.5" /></>);
export const ClipartIcon = I(<><path d="m12 3 2.5 5 5.5.8-4 3.9 1 5.5-5-2.6-5 2.6 1-5.5-4-3.9 5.5-.8Z" /></>);
export const LogoIcon = I(<><circle cx="12" cy="12" r="9" /><path d="M8.5 15.5 12 8l3.5 7.5" /><path d="M9.7 13h4.6" /></>);
export const QrIcon = I(<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3" /></>);
export const PaletteIcon = I(<><path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.8 1.6-1.6 0-1.3-1.1-1.6-1.1-2.7 0-.9.7-1.7 1.7-1.7H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3Z" /><circle cx="7.5" cy="11" r="1" fill="currentColor" /><circle cx="10" cy="7" r="1" fill="currentColor" /><circle cx="15" cy="7" r="1" fill="currentColor" /></>);
