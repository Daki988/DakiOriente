/** Fil d'Ariane (ERG-01 : repérage) ; la page courante n'est pas un lien. */
export function FilAriane({ elements }: { elements: { libelle: string; href?: string }[] }) {
  return (
    <nav className="cj-fil" aria-label="Fil d’Ariane">
      <ol>
        {elements.map((e, i) => (
          <li key={e.libelle}>
            {e.href && i < elements.length - 1 ? <a href={e.href}>{e.libelle}</a> : <span aria-current="page">{e.libelle}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
