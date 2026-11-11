import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Icon, Logo } from './Icon';
import { useSession } from '../app/hooks';
import { signOut } from '../app/auth';
import { NotificationBell } from './Notifications';

const FARM_TABS = [
  { to: '/', icon: 'home', label: 'Accueil' },
  { to: '/bandes', icon: 'bands', label: 'Bandes' },
  { to: '/lots', icon: 'qr', label: 'Lots' },
  { to: '/plus', icon: 'grid', label: 'Plus' },
  { to: '/profil', icon: 'user', label: 'Profil' },
];
const OPERATOR_TABS = [
  { to: '/', icon: 'truck', label: 'Réception' },
  { to: '/abattage', icon: 'bands', label: 'Abattages' },
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

const ALL = ['dge', 'veterinaire', 'admin', 'bceg'];
const NAV: { to: string; icon: string; label: string; roles: string[]; section?: string }[] = [
  { to: '/', icon: 'grid', label: 'Vue nationale', roles: ['dge', 'bceg'] },
  { to: '/', icon: 'report', label: 'Diffusion des données', roles: ['maedr'] },
  { to: '/', icon: 'search', label: "Journal d'audit", roles: ['aninf'] },
  { to: '/', icon: 'gear', label: 'Administration', roles: ['admin'], section: 'Administration' },
  { to: '/admin/comptes', icon: 'user', label: 'Comptes', roles: ['admin'] },
  { to: '/admin/demandes', icon: 'report', label: "Demandes d'accès", roles: ['admin'] },
  { to: '/admin/droits', icon: 'check', label: 'Matrice des droits', roles: ['admin'] },
  { to: '/admin/operateurs', icon: 'truck', label: 'Opérateurs', roles: ['admin'] },
  { to: '/admin/journal', icon: 'search', label: "Journal d'audit", roles: ['admin'] },
  { to: '/national', icon: 'grid', label: 'Vue nationale', roles: ['admin'], section: 'Pilotage' },
  { to: '/rapports', icon: 'report', label: 'Rapports', roles: ['dge', 'admin', 'veterinaire', 'bceg'], section: 'Suivi' },
  { to: '/fermes', icon: 'farm', label: 'Fermes', roles: ALL },
  { to: '/classement', icon: 'bands', label: 'Classement', roles: ['dge', 'admin'] },
  { to: '/economie', icon: 'bands', label: 'Économie', roles: ['dge', 'admin', 'bceg'] },
  { to: '/commandes', icon: 'box', label: "Commandes d'intrants", roles: ['dge', 'admin'] },
  { to: '/abattage', icon: 'truck', label: "Rendez-vous d'abattage", roles: ['dge', 'admin'] },
  { to: '/alertes', icon: 'heart', label: 'Alertes sanitaires', roles: ['dge', 'veterinaire', 'admin'], section: 'Sanitaire' },
  { to: '/diagnostics', icon: 'report', label: 'Diagnostics', roles: ['veterinaire', 'admin', 'dge'] },
  { to: '/biosecurite', icon: 'check', label: 'Biosécurité', roles: ['veterinaire', 'admin', 'dge'] },
  { to: '/assistance', icon: 'heart', label: 'Assistance à distance', roles: ['veterinaire', 'admin'] },
  { to: '/tracer', icon: 'qr', label: 'Traçabilité', roles: ['dge', 'veterinaire', 'admin'], section: 'Traçabilité' },
  { to: '/etiquettes', icon: 'print', label: 'Étiquettes QR', roles: ['dge', 'admin'] },
  { to: '/visites', icon: 'pin', label: 'Visites techniques', roles: ['dge', 'admin'] },
  { to: '/prix', icon: 'bands', label: 'Observatoire des prix', roles: ['dge', 'admin', 'bceg'] },
  { to: '/offres', icon: 'share', label: 'Mise en relation', roles: ['dge', 'admin'] },
  { to: '/saisies/fiches', icon: 'report', label: 'Fiches journalières', roles: ['admin'], section: 'Corrections' },
  { to: '/saisies/pesees', icon: 'scale', label: 'Pesées', roles: ['admin'] },
  { to: '/charges', icon: 'report', label: 'Charges', roles: ['admin', 'dge', 'bceg'] },
  { to: '/diffusion', icon: 'report', label: 'Diffusion des données', roles: ['dge', 'admin'], section: 'Données' },
  { to: '/reprise', icon: 'box', label: 'Reprise des données', roles: ['dge', 'admin'] },
  { to: '/parametres', icon: 'gear', label: 'Paramètres', roles: ['dge', 'veterinaire', 'admin'] },
  { to: '/profil', icon: 'user', label: 'Profil', roles: ['dge', 'veterinaire', 'admin', 'bceg', 'maedr', 'aninf'], section: 'Compte' },
];

/**
 * Coque web de pilotage et d'administration (DGE, vétérinaires, BCEG, MAEDR, ANINF, administrateur).
 * Sur ordinateur, le menu reste à gauche. Sur téléphone et tablette (application mobile comprise), une barre
 * supérieure ouvre le même menu en tiroir : aucun profil ne reste sans navigation.
 */
export function WebShell() {
  const s = useSession();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [open]);
  const items = NAV.filter((n) => n.roles.includes(s.role));
  const current = items.find((n) => n.to === pathname)?.label ?? items.find((n) => n.to !== '/' && pathname.startsWith(n.to))?.label ?? 'Origa';
  return (
    <div className="w-shell">
      <header className="w-top">
        <button className="iconbtn" data-nav aria-label="Ouvrir le menu" aria-expanded={open} aria-controls="menu-principal" onClick={() => setOpen(true)}><Icon name="menu" size={24} color="#fff" /></button>
        <div className="brand"><Logo dark />{current}</div>
        <NotificationBell light />
      </header>
      {open && <div className="side-veil" onClick={() => setOpen(false)} />}
      <aside className={`side${open ? ' open' : ''}`} id="menu-principal" aria-label="Menu principal">
        <div className="side-top"><div className="brand"><Logo dark />Origa</div><span className="side-bell"><NotificationBell light /></span>
          <button className="iconbtn side-close" aria-label="Fermer le menu" onClick={() => setOpen(false)}><Icon name="close" size={22} color="#fff" /></button></div>
        {items.map((n) => (
          <div key={n.label}>
            {n.section && <div className="side-sec">{n.section}</div>}
            <NavLink to={n.to} end className={({ isActive }) => `nav${isActive ? ' active' : ''}`} onClick={() => setOpen(false)}>
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
