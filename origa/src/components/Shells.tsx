import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Icon, Logo } from './Icon';
import { useSession } from '../app/hooks';

const TABS = [
  { to: '/', icon: 'home', label: 'Accueil' },
  { to: '/bandes', icon: 'bands', label: 'Bandes' },
  { to: '/lots', icon: 'qr', label: 'Lots' },
  { to: '/profil', icon: 'user', label: 'Profil' },
];

/** Coque mobile (Android, HarmonyOS 2, iOS) : barre d'onglets en bas, écrans calqués sur la fiche papier. */
export function MobileShell() {
  const { pathname } = useLocation();
  const showTabs = TABS.some((t) => t.to === pathname);
  return (
    <div className="m-shell">
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}><Outlet /></main>
      {showTabs && (
        <nav className="tabbar" aria-label="Navigation principale">
          {TABS.map((t) => (
            <NavLink key={t.to} to={t.to} end className={({ isActive }) => `tab${isActive ? ' active' : ''}`}>
              <Icon name={t.icon} size={22} />{t.label}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}

const NAV = [
  { to: '/', icon: 'grid', label: 'Vue nationale', roles: ['dge', 'admin', 'bceg'] },
  { to: '/alertes', icon: 'heart', label: 'Alertes sanitaires', roles: ['dge', 'veterinaire', 'admin'] },
  { to: '/fermes', icon: 'farm', label: 'Fermes', roles: ['dge', 'veterinaire', 'admin', 'bceg'] },
  { to: '/tracer', icon: 'search', label: 'Traçabilité', roles: ['dge', 'veterinaire', 'admin'] },
  { to: '/parametres', icon: 'gear', label: 'Paramètres', roles: ['dge', 'veterinaire', 'admin'] },
  { to: '/profil', icon: 'user', label: 'Profil', roles: ['dge', 'veterinaire', 'admin', 'bceg'] },
];

/** Coque web de pilotage (DGE, services vétérinaires, BCEG). */
export function WebShell() {
  const s = useSession();
  return (
    <div className="w-shell">
      <aside className="side">
        <div className="brand"><Logo dark />Origa</div>
        {NAV.filter((n) => n.roles.includes(s.role)).map((n) => (
          <NavLink key={n.to} to={n.to} end className={({ isActive }) => `nav${isActive ? ' active' : ''}`}>
            <Icon name={n.icon} size={18} />{n.label}
          </NavLink>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 12, color: '#8FBFA9', padding: '0 12px' }}>Connecté : {s.userLabel}</div>
      </aside>
      <main className="main"><Outlet /></main>
    </div>
  );
}
