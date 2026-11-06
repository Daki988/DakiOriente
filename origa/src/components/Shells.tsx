import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Icon, Logo } from './Icon';
import { useSession } from '../app/hooks';
import { signOut } from '../app/auth';

const FARM_TABS = [
  { to: '/', icon: 'home', label: 'Accueil' },
  { to: '/bandes', icon: 'bands', label: 'Bandes' },
  { to: '/lots', icon: 'qr', label: 'Lots' },
  { to: '/profil', icon: 'user', label: 'Profil' },
];
const OPERATOR_TABS = [
  { to: '/', icon: 'truck', label: 'Réception' },
  { to: '/profil', icon: 'user', label: 'Profil' },
];

/** Coque mobile (Android, HarmonyOS 2, iOS) : barre d'onglets en bas, écrans calqués sur la fiche papier. */
export function MobileShell() {
  const { pathname } = useLocation();
  const s = useSession();
  const tabs = s.role === 'operateur' ? OPERATOR_TABS : FARM_TABS;
  const showTabs = tabs.some((t) => t.to === pathname);
  return (
    <div className="m-shell">
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }} key={pathname} className="page-in"><Outlet /></main>
      {showTabs && (
        <nav className="tabbar" aria-label="Navigation principale">
          {tabs.map((t) => (
            <NavLink key={t.to} to={t.to} end className={({ isActive }) => `tab${isActive ? ' active' : ''}`}>
              <Icon name={t.icon} size={22} />{t.label}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}

const NAV: { to: string; icon: string; label: string; roles: string[]; section?: string }[] = [
  { to: '/', icon: 'grid', label: 'Vue nationale', roles: ['dge', 'bceg'] },
  { to: '/', icon: 'gear', label: 'Administration', roles: ['admin'], section: 'Administration' },
  { to: '/admin/comptes', icon: 'user', label: 'Comptes', roles: ['admin'] },
  { to: '/admin/demandes', icon: 'report', label: "Demandes d'accès", roles: ['admin'] },
  { to: '/admin/operateurs', icon: 'truck', label: 'Opérateurs', roles: ['admin'] },
  { to: '/admin/journal', icon: 'search', label: "Journal d'audit", roles: ['admin'] },
  { to: '/national', icon: 'grid', label: 'Vue nationale', roles: ['admin'], section: 'Pilotage' },
  { to: '/alertes', icon: 'heart', label: 'Alertes sanitaires', roles: ['dge', 'veterinaire', 'admin'] },
  { to: '/fermes', icon: 'farm', label: 'Fermes', roles: ['dge', 'veterinaire', 'admin', 'bceg'] },
  { to: '/tracer', icon: 'qr', label: 'Traçabilité', roles: ['dge', 'veterinaire', 'admin'] },
  { to: '/parametres', icon: 'gear', label: 'Paramètres', roles: ['dge', 'veterinaire', 'admin'] },
  { to: '/profil', icon: 'user', label: 'Profil', roles: ['dge', 'veterinaire', 'admin', 'bceg'], section: 'Compte' },
];

/** Coque web de pilotage et d'administration (DGE, vétérinaires, BCEG, administrateur). */
export function WebShell() {
  const s = useSession();
  const { pathname } = useLocation();
  return (
    <div className="w-shell">
      <aside className="side">
        <div className="brand"><Logo dark />Origa</div>
        {NAV.filter((n) => n.roles.includes(s.role)).map((n) => (
          <div key={n.label}>
            {n.section && <div className="side-sec">{n.section}</div>}
            <NavLink to={n.to} end className={({ isActive }) => `nav${isActive ? ' active' : ''}`}>
              <Icon name={n.icon} size={18} />{n.label}
            </NavLink>
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <div className="side-user">
          <span>{s.userLabel}</span>
          <button className="nav" onClick={signOut}><Icon name="back" size={18} />Se déconnecter</button>
        </div>
      </aside>
      <main className="main page-in" key={pathname}><Outlet /></main>
    </div>
  );
}
