"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3, Bell, BookOpen, Briefcase, Building2, Calculator, ChevronDown, Compass, FileCheck2, FileText, Folder, GraduationCap, Headset, House, KeyRound, LayoutDashboard, LogOut,
  MailWarning, Megaphone, Menu, MessageCircle, ScrollText, Search, Settings2, ShieldCheck, Sparkles, UserRound, Users, UsersRound, Wallet, X, type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Brand, BrandMark } from "./Brand";
import { SessionProvider } from "@/components/app/Session";
import { DeviseProfil } from "@/components/ui/Devise";
import { Avatar, ToastProvider } from "@/components/app/kit";
import { api } from "@/lib/api";
import type { ClientUser } from "@/server/session-ui";

type Item = { href: string; Icon: LucideIcon; t: string; m?: string; badge?: "notif" | "msg"; group?: string };
const MSG: Item = { href: "/messages", Icon: MessageCircle, t: "Messages", badge: "msg", group: "Compte" };
const NOTIF: Item = { href: "/notifications", Icon: Bell, t: "Notifications", badge: "notif", group: "Compte" };
const SETTINGS: Item = { href: "/compte", Icon: Settings2, t: "Paramètres", group: "Compte" };
type Menu = { label: string; tint: string; items: Item[]; tabs: string[] };
const MENUS: Record<string, Menu> = {
  etudiant: { label: "Espace étudiant", tint: "bg-brand-50 text-brand-700", tabs: ["/espace", "/orientation", "/espace/candidatures", "/messages"], items: [
    { href: "/espace", Icon: LayoutDashboard, t: "Tableau de bord", m: "Accueil" }, { href: "/espace/profil", Icon: UserRound, t: "Mon profil", m: "Profil" },
    { href: "/orientation", Icon: Compass, t: "Mon orientation", m: "Orientation" }, { href: "/espace/orientation", Icon: Sparkles, t: "Mon profil d'orientation" },
    { href: "/metiers", Icon: Briefcase, t: "Métiers", group: "Explorer" }, { href: "/formations", Icon: GraduationCap, t: "Formations", group: "Explorer" }, { href: "/etablissements", Icon: Building2, t: "Établissements", group: "Explorer" },
    { href: "/espace/candidatures", Icon: FileText, t: "Mes candidatures", m: "Candidatures", group: "Mes démarches" }, { href: "/espace/documents", Icon: Folder, t: "Mes documents", group: "Mes démarches" },
    { href: "/espace/paiements", Icon: Wallet, t: "Paiements", group: "Mes démarches" }, { href: "/espace/logement", Icon: KeyRound, t: "Mon logement", group: "Mes démarches" },
    { href: "/espace/conseiller", Icon: Headset, t: "Conseiller", group: "Mes démarches" }, MSG, NOTIF, SETTINGS] },
  parent: { label: "Espace parent", tint: "bg-sun-100 text-[#a55a00]", tabs: ["/parent", "/parent/enfants", "/parent/paiements", "/messages"], items: [
    { href: "/parent", Icon: LayoutDashboard, t: "Vue d'ensemble", m: "Accueil" }, { href: "/parent/enfants", Icon: UsersRound, t: "Mes enfants", m: "Enfants" }, { href: "/devis", Icon: Calculator, t: "Devis & budget" },
    { href: "/parent/paiements", Icon: Wallet, t: "Paiements" }, { href: "/parent/logement", Icon: KeyRound, t: "Logement" }, { href: "/parent/conseiller", Icon: Headset, t: "Conseiller" }, MSG, NOTIF, SETTINGS] },
  etablissement: { label: "Espace établissement", tint: "bg-[#f1edff] text-[#6a3df0]", tabs: ["/etablissement", "/etablissement/candidatures", "/etablissement/formations", "/messages"], items: [
    { href: "/etablissement", Icon: LayoutDashboard, t: "Tableau de bord", m: "Accueil" }, { href: "/etablissement/fiche", Icon: Building2, t: "Mon établissement" },
    { href: "/etablissement/formations", Icon: GraduationCap, t: "Formations" }, { href: "/etablissement/candidatures", Icon: FileCheck2, t: "Candidatures" },
    { href: "/etablissement/campagnes", Icon: Megaphone, t: "Campagnes" }, MSG, NOTIF, SETTINGS] },
  bailleur: { label: "Espace bailleur Navilease", tint: "bg-[#ffecef] text-[#d42a50]", tabs: ["/bailleur", "/bailleur/annonces", "/bailleur/reservations", "/messages"], items: [
    { href: "/bailleur", Icon: LayoutDashboard, t: "Tableau de bord", m: "Accueil" }, { href: "/bailleur/annonces", Icon: House, t: "Mes annonces", m: "Annonces" },
    { href: "/bailleur/reservations", Icon: KeyRound, t: "Demandes & réservations", m: "Réservations" }, { href: "/bailleur/profil", Icon: ShieldCheck, t: "Vérification & versements" }, MSG, NOTIF, SETTINGS] },
  conseiller: { label: "Espace conseiller", tint: "bg-[#e8f8ef] text-[#0f8a46]", tabs: ["/conseiller", "/messages", "/notifications"], items: [{ href: "/conseiller", Icon: Headset, t: "Rendez-vous" }, MSG, NOTIF, SETTINGS] },
  admin: { label: "Back-office", tint: "bg-ink text-white", tabs: ["/admin", "/admin/utilisateurs", "/admin/etablissements", "/admin/homologations"], items: [
    { href: "/admin", Icon: BarChart3, t: "Statistiques" }, { href: "/admin/utilisateurs", Icon: Users, t: "Utilisateurs" }, { href: "/admin/etablissements", Icon: Building2, t: "Établissements" },
    { href: "/admin/homologations", Icon: ShieldCheck, t: "Homologations" }, { href: "/admin/referentiels", Icon: BookOpen, t: "Référentiels" }, { href: "/admin/navilease", Icon: KeyRound, t: "Navilease" },
    { href: "/admin/paiements", Icon: Wallet, t: "Paiements" }, { href: "/admin/contenus", Icon: Briefcase, t: "Contenus" }, { href: "/admin/campagne", Icon: Megaphone, t: "Campagne" }, { href: "/admin/journal", Icon: ScrollText, t: "Journal" }, MSG, NOTIF, SETTINGS] },
};
MENUS.eleve = { ...MENUS.etudiant, label: "Espace élève" };
const GUEST: Item[] = [{ href: "/", Icon: House, t: "Accueil" }, { href: "/orientation", Icon: Compass, t: "Test d'orientation", m: "Test" }, { href: "/formations", Icon: GraduationCap, t: "Formations" }, { href: "/etablissements", Icon: Building2, t: "Établissements", m: "Écoles" }, { href: "/navilease", Icon: KeyRound, t: "Navilease" }];
const ROLE_SUB: Record<string, string> = { eleve: "Élève", etudiant: "Étudiant·e", parent: "Parent / tuteur", etablissement: "Établissement", bailleur: "Bailleur Navilease", conseiller: "Conseiller", admin: "Administrateur" };
const ROOTS = ["/espace", "/parent", "/etablissement", "/bailleur", "/admin", "/conseiller", "/"];

export function AppShell({ user, children }: { user: ClientUser | null; children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const menu = user ? MENUS[user.role] : null;
  const items = menu?.items ?? GUEST;
  const tabs = menu ? menu.tabs.map((h) => items.find((i) => i.href === h)!).filter(Boolean) : GUEST.slice(0, 4);
  const [counts, setCounts] = useState({ notif: 0, msg: 0 });
  const [open, setOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [n, c] = await Promise.all([api<{ unread: number }>("/notifications"), api<{ unread: number }[]>("/conversations")]);
        setCounts({ notif: n.unread, msg: c.reduce((a, x) => a + x.unread, 0) });
      } catch { /* hors ligne */ }
    };
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [user, path]);
  useEffect(() => { setOpen(false); setUserMenu(false); }, [path]);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);
  const clean = (p: string) => p.replace(/\/$/, "") || "/";
  // Lien actif : correspondance exacte pour les racines d'espace, sinon le plus long préfixe parmi les entrées du menu.
  const best = items.filter((i) => clean(path) === clean(i.href) || (!ROOTS.includes(i.href) && clean(path).startsWith(clean(i.href) + "/"))).sort((a, b) => b.href.length - a.href.length)[0]?.href;
  const active = (href: string) => href === best;
  const logout = async () => { await api("/auth/deconnexion", { method: "POST" }).catch(() => {}); router.replace("/connexion/?deconnexion=1"); router.refresh(); };
  const unverified = user && ((user.email && !user.emailVerified) || (!user.email && user.phone && !user.phoneVerified));

  const Nav = ({ onPick }: { onPick?: () => void }) => {
    let last: string | undefined;
    return (
      <nav className="flex flex-col gap-0.5" aria-label="Navigation de l'espace">
        {items.map(({ href, Icon, t, badge, group }) => {
          const on = active(href);
          const n = badge ? counts[badge] : 0;
          const head = group !== last ? group : undefined;
          last = group;
          return (
            <div key={href}>
              {head && <span className="mb-1 mt-3 block px-3.5 text-[11px] font-extrabold uppercase tracking-wider text-ink-mute/80">{head}</span>}
              <Link href={href} onClick={onPick} aria-current={on ? "page" : undefined} className={`relative flex min-h-[42px] items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${on ? "text-brand-600" : "text-ink-soft hover:bg-[#f6f8fe]"}`}>
                {on && <motion.span layoutId="side-pill" className="absolute inset-0 rounded-xl bg-brand-50" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
                <Icon size={18} className="relative shrink-0" /><span className="relative truncate">{t}</span>
                {n > 0 && <span className="relative ml-auto rounded-full bg-sun-400 px-2 text-xs font-bold text-ink">{n}</span>}
              </Link>
            </div>
          );
        })}
      </nav>
    );
  };

  return (
    <SessionProvider user={user}>
      <DeviseProfil country={user?.country} />
      <ToastProvider>
        <div className="flex min-h-screen">
          <aside className="sticky top-0 hidden h-screen w-[256px] shrink-0 flex-col gap-4 overflow-y-auto border-r border-slate-200/70 bg-white px-4 py-6 lg:flex">
            <div className="px-2"><Brand /></div>
            {menu && <span className={`chip mx-2 self-start ${menu.tint}`}>{menu.label}</span>}
            <Nav />
            {user && ["eleve", "etudiant", "parent"].includes(user.role) && (
              <div className="mt-auto flex flex-col gap-2 rounded-[18px] bg-gradient-to-br from-brand-600 to-brand-400 p-4 text-white">
                <b>Besoin d&apos;aide ?</b><span className="text-xs text-brand-100">Échange avec un conseiller d&apos;orientation.</span>
                <Link href={user.role === "parent" ? "/parent/conseiller" : "/espace/conseiller"} className="btn-sun btn-shine py-2 text-[13px]">Prendre rendez-vous</Link>
              </div>
            )}
            {!user && <div className="mt-auto flex flex-col gap-2"><Link href="/connexion" className="btn-ghost">Se connecter</Link><Link href="/inscription" className="btn-primary">Créer un compte</Link></div>}
          </aside>
          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-2 border-b border-slate-200/70 bg-white/90 px-3 backdrop-blur-xl sm:h-[68px] sm:gap-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-1.5 lg:hidden">
                <button onClick={() => setOpen(true)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f1f4fd]" aria-label="Ouvrir le menu" aria-expanded={open}><Menu size={20} /></button>
                <Link href={user ? (menu?.items[0].href ?? "/") : "/"} className="flex items-center gap-1.5 sm:hidden" aria-label="Navigoal"><BrandMark size={34} /></Link>
                <span className="hidden sm:block"><Brand /></span>
              </div>
              <Link href="/recherche" className="hidden w-full max-w-[420px] items-center gap-2.5 rounded-xl bg-[#f6f8fe] px-4 py-2.5 text-sm text-ink-mute hover:bg-brand-50 md:flex"><Search size={18} />Rechercher un métier, une formation…</Link>
              {user ? (
                <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
                  <Link href="/recherche" aria-label="Rechercher" className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f6f8fe] md:hidden"><Search size={19} /></Link>
                  <Link href="/notifications" aria-label={`Notifications${counts.notif ? ` (${counts.notif} non lues)` : ""}`} className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#f6f8fe] sm:h-[42px] sm:w-[42px]">
                    <Bell size={19} />{counts.notif > 0 && <><span className="absolute right-2.5 top-2.5 h-2 w-2 animate-ping rounded-full bg-[#ff3d7f]" /><span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#ff3d7f]" /></>}
                  </Link>
                  <div className="relative">
                    <button onClick={() => setUserMenu(!userMenu)} className="flex items-center gap-2.5 rounded-xl px-1 py-1 hover:bg-[#f6f8fe]" aria-expanded={userMenu} aria-label="Menu du compte">
                      <Avatar name={`${user.firstName} ${user.lastName}`} size={36} />
                      <span className="hidden text-left sm:block"><b className="block max-w-[160px] truncate text-sm">Bonjour, {user.firstName}</b><span className="text-xs text-ink-mute">{ROLE_SUB[user.role]}{user.city ? ` · ${user.city}` : ""}</span></span>
                      <ChevronDown size={16} className="hidden text-ink-mute sm:block" />
                    </button>
                    <AnimatePresence>{userMenu && (
                      <>
                        <button className="fixed inset-0 z-40 cursor-default" aria-label="Fermer le menu du compte" onClick={() => setUserMenu(false)} />
                        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute right-0 top-12 z-50 flex w-60 flex-col rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lift">
                          <span className="border-b border-slate-100 px-3 py-2 text-xs text-ink-mute"><b className="block text-sm text-ink">{user.firstName} {user.lastName}</b>{user.email ?? user.phone}</span>
                          {["eleve", "etudiant"].includes(user.role) && <Link href="/espace/profil" className="flex min-h-[40px] items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-[#f6f8fe]"><UserRound size={16} />Mon profil</Link>}
                          <Link href="/compte" className="flex min-h-[40px] items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-[#f6f8fe]"><Settings2 size={16} />Compte et sécurité</Link>
                          <Link href="/" className="flex min-h-[40px] items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-[#f6f8fe]"><House size={16} />Site public</Link>
                          <button onClick={logout} className="flex min-h-[40px] items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#d42a50] hover:bg-[#fff1f3]"><LogOut size={16} />Se déconnecter</button>
                        </motion.div>
                      </>
                    )}</AnimatePresence>
                  </div>
                </div>
              ) : <Link href="/connexion" className="btn-primary shrink-0 px-4 py-2.5">Se connecter</Link>}
            </header>
            {unverified && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[#f6dd9a] bg-[#fff7dd] px-4 py-2.5 text-[13px] text-[#8a4b00] sm:px-8">
                <MailWarning size={16} className="shrink-0" /><span className="flex-1">Vérifie ton {user!.email ? "adresse e-mail" : "numéro de téléphone"} pour sécuriser ton compte et recevoir les alertes.</span>
                <Link href={`/verification/?cible=${encodeURIComponent((user!.email ?? user!.phone)!)}&objet=${user!.email ? "verify_email" : "verify_phone"}`} className="font-bold underline">Vérifier maintenant</Link>
              </div>
            )}
            {user?.role === "etablissement" && user.status === "en_attente" && (
              <div className="flex items-start gap-2.5 border-b border-[#f6dd9a] bg-[#fff7dd] px-4 py-2.5 text-[13px] text-[#8a4b00] sm:px-8"><ShieldCheck size={16} className="mt-0.5 shrink-0" /><span>Compte en cours de vérification par l&apos;équipe Navigoal (rattachement à l&apos;établissement, sous 48 h ouvrées). Vous serez notifié dès son activation.</span></div>
            )}
            <main className="min-w-0 flex-1 px-3 pb-24 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pb-10">{children}</main>
          </div>
        </div>
        <AnimatePresence>{open && (
          <motion.div className="fixed inset-0 z-[80] bg-ink/40 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
            <motion.aside role="dialog" aria-modal="true" aria-label="Menu" initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }} transition={{ type: "spring", stiffness: 300, damping: 32 }} onClick={(e) => e.stopPropagation()}
              className="flex h-full w-[min(86vw,300px)] flex-col gap-4 overflow-y-auto bg-white p-4 pb-[max(env(safe-area-inset-bottom),16px)]">
              <div className="flex items-center justify-between"><Brand /><button onClick={() => setOpen(false)} aria-label="Fermer le menu" className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f1f4fd]"><X size={18} /></button></div>
              {user && <div className="flex items-center gap-3 rounded-2xl bg-[#f6f8fe] p-3"><Avatar name={`${user.firstName} ${user.lastName}`} size={40} /><span className="min-w-0"><b className="block truncate text-sm">{user.firstName} {user.lastName}</b><span className={`chip mt-0.5 ${menu?.tint}`}>{menu?.label}</span></span></div>}
              <Nav onPick={() => setOpen(false)} />
              {user ? <button onClick={logout} className="mt-auto flex min-h-[44px] items-center gap-2 rounded-xl px-3.5 text-sm font-bold text-[#d42a50] hover:bg-[#fff1f3]"><LogOut size={16} />Se déconnecter</button>
                : <div className="mt-auto flex flex-col gap-2"><Link href="/connexion" className="btn-ghost">Se connecter</Link><Link href="/inscription" className="btn-primary">Créer un compte</Link></div>}
            </motion.aside>
          </motion.div>
        )}</AnimatePresence>
        <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-white/95 px-1 pb-[max(env(safe-area-inset-bottom),6px)] pt-1.5 backdrop-blur lg:hidden" aria-label="Raccourcis">
          {tabs.slice(0, 4).map(({ href, Icon, t, m, badge }) => {
            const on = active(href);
            const n = badge ? counts[badge] : 0;
            return (
              <Link key={href} href={href} aria-current={on ? "page" : undefined} className={`relative flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-bold ${on ? "text-brand-600" : "text-ink-mute"}`}>
                {on && <motion.span layoutId="mob-pill" className="absolute -top-1.5 h-1 w-8 rounded-full bg-brand-600" />}
                <span className="relative"><Icon size={21} />{n > 0 && <span className="absolute -right-2.5 -top-1.5 min-w-[18px] rounded-full bg-sun-400 px-1 text-center text-[10px] leading-[18px] text-ink">{n}</span>}</span>
                <span className="max-w-full truncate px-0.5">{m ?? t}</span>
              </Link>
            );
          })}
          <button onClick={() => setOpen(true)} className="flex min-h-[48px] flex-col items-center justify-center gap-0.5 text-[11px] font-bold text-ink-mute" aria-label="Plus de rubriques"><Menu size={21} />Menu</button>
        </nav>
      </ToastProvider>
    </SessionProvider>
  );
}
