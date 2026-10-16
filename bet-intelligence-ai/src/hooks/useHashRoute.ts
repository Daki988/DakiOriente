import { useCallback, useEffect, useState } from 'react';

export const ROUTES = ['dashboard', 'matchs', 'analyse', 'generateur', 'tickets', 'performances', 'parametres'] as const;
export type RouteId = (typeof ROUTES)[number];

function parse(hash: string): RouteId {
  const id = hash.replace(/^#\/?/, '').split('?')[0] as RouteId;
  return ROUTES.includes(id) ? id : 'dashboard';
}

/** Routage minimal par hash (#/matchs) : la page survit à l'actualisation, sans dépendance. */
export function useHashRoute(): [RouteId, (r: RouteId) => void] {
  const [route, setRoute] = useState<RouteId>(() => parse(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parse(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  const navigate = useCallback((r: RouteId) => {
    if (parse(window.location.hash) !== r) window.location.hash = r;
    else setRoute(r);
    window.scrollTo({ top: 0 });
  }, []);
  return [route, navigate];
}
