/** Logo Neam Print sans l'icône (« NEAM » + « Print »). `light` : version blanche pour fonds sombres. */
export function Logo({ light = false, className = "h-10 w-auto" }: { light?: boolean; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={light ? "/brand/logo-blanc.svg" : "/brand/logo.svg"} alt="Neam Print" width={832} height={428} className={className} />;
}
