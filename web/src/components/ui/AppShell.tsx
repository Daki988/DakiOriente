"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3, Bell, BookOpen, Briefcase, Building2, Calculator, ChevronDown, Compass, FileCheck2, FileText, Folder, GraduationCap, Headset, House, KeyRound, LayoutDashboard, LogOut,
  Megaphone, Menu, MessageCircle, ScrollText, Search, Settings2, ShieldCheck, UserRound, Users, UsersRound, Wallet, X, type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Brand } from "./Brand";
import { SessionProvider } from "@/components/app/Session";
import { Avatar, ToastProvider } from "@/components/app/kit";
import { api } from "@/lib/api";
import type { ClientUser } from "@/server/session-ui";

type Item = { href: string; Icon: LucideIcon; t: string; badge?: "notif" | "msg" };
const COMMON: Item[] = [{ href: "/messages", Icon: MessageCircle, t: "Messages", badge: "msg" }, { href: "/notifications", Icon: Bell, t: "Notifications", badge: "notif" }];
const MENUS: Record<string, { label: string; tint: string; items: Item[] }> = {
  etudiant: { label: "Espace étudiant", tint: "bg-brand-50 text-brand-700", items: [
    { href: "/espace", Icon: LayoutDashboard, t: "Tableau de bord" }, { href: "/espace/profil", Icon: UserRound, t: "Mon profil" }, { href: "/orientation", Icon: Compass, t: "Mon orientation" },
    { href: "/espace/candidatures", Icon: FileText, t: "Mes candidatures" }, { href: "/espace/documents", Icon: Folder, t: "Mes documents" }, { href: "/espace/paiements", Icon: Wallet, t: "Paiements" },
    { href: "/espace/logement", Icon: KeyRound, t: "Mon logement" }, ...COMMON, { href: "/espace/conseiller", Icon: Headset, t: "Conseiller" }] },
  parent: { label: "Espace parent", tint: "bg-sun-100 text-[#a55a00]", items: [
    { href: "/parent", Icon: LayoutDashboard, t: "Vue d'ensemble" }, { href: "/parent/enfants", Icon: UsersRound, t: "Mes enfants" }, { href: "/devis", Icon: Calculator, t: "Devis & budget" },
    { href: "/parent/paiements", Icon: Wallet, t: "Paiements" }, { href: "/parent/logement", Icon: KeyRound, t: "Logement" }, ...COMMON, { href: "/parent/conseiller", Icon: Headset, t: "Conseiller" }] },
  etablissement: { label: "Espace établissement", tint: "bg-[#f1edff] text-[#6a3df0]", items: [
    { href: "/etablissement", Icon: LayoutDashboard, t: "Tableau de bord" }, { href: "/etablissement/candidatures", Icon: FileCheck2, t: "Candidatures" }, { href: "/etablissement/formations", Icon: GraduationCap, t: "Formations" },
    { href: "/etablissement/campagnes", Icon: Megaphone, t: "Campagnes" }, { href: "/etablissement/fiche", Icon: Building2, t: "Fiche établissement" }, ...COMMON] },
  bailleur: { label: "Espace bailleur", tint: "bg-[#ffecef] text-[#d42a50]", items: [
    { href: "/bailleur", Icon: LayoutDashboard, t: "Tableau de bord" }, { href: "/bailleur/annonces", Icon: House, t: "Mes annonces" }, { href: "/bailleur/reservations", Icon: KeyRound, t: "Demandes & réservations" },
    { href: "/bailleur/profil", Icon: ShieldCheck, t: "Vérification & versements" }, ...COMMON] },
  conseiller: { label: "Espace conseiller", tint: "bg-[#e8f8ef] text-[#0f8a46]", items: [{ href: "/conseiller", Icon: Headset, t: "Rendez-vous" }, ...COMMON] },
  admin: { label: "Back-office", tint: "bg-ink text-white", items: [
    { href: "/admin", Icon: BarChart3, t: "Statistiques" }, { href: "/admin/utilisateurs", Icon: Users, t: "Utilisateurs" }, { href: "/admin/etablissements", Icon: Building2, t: "Établissements" }, { href: "/admin/homologations", Icon: ShieldCheck, t: "Homologations" },
    { href: "/admin/referentiels", Icon: BookOpen, t: "Référentiels" }, { href: "/admin/navilease", Icon: KeyRound, t: "Navilease" }, { href: "/admin/paiements", Icon: Wallet, t: "Paiements" },
    { href: "/admin/contenus", Icon: Briefcase, t: "Contenus" }, { href: "/admin/journal", Icon: ScrollText, t: "Journal" }, ...COMMON] },
};
MENUS.eleve = { ...MENUS.etudiant, label: "Espace élève" };
const GUEST: Item[] = [{ href: "/", Icon: House, t: "Accueil" }, { href: "/orientation", Icon: Compass, t: "Test d'orientation" }, { href: "/formations", Icon: GraduationCap, t: "Formations" }, { href: "/etablissements", Icon: Building2, t: "Établissements" }, { href: "/navilease", Icon: KeyRound, t: "Navilease" }];
// Libellé court pour la barre mobile : « Mes candidatures » → « Candidatures ».
const short = (t: string) => { const w = t.split(" ").filter((x) => !["Mon", "Mes", "Ma", "de", "&", "d'ensemble"].includes(x))[0] ?? t; return w.charAt(0).toUpperCase() + w.slice(1); };
const ROLE_SUB: Record<string, string> = { eleve: "Élève", etudiant: "Étudiant·e", parent: "Parent / tuteur", etablissement: "Établissement", bailleur: "Bailleur Navilease", conseiller: "Conseiller", admin: "Administrateur" };

export function AppShell({ user, children }: { user: ClientUser | null; children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const menu = user ? MENUS[user.role] : null;
  const items = menu?.items ?? GUEST;
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
  const active = (href: string) => (["/espace", "/parent", "/etablissement", "/bailleur", "/admin", "/conseiller", "/"].includes(href) ? path.replace(/\/$/, "") === href.replace(/\/$/, "") || (href !== "/" && path === href + "/") : path.startsWith(href));
  const logout = async () => { await api("/auth/deconnexion", { method: "POST" }).catch(() => {}); router.push("/"); router.refresh(); };

  const Nav = (
    <nav className="flex flex-col gap-1" aria-label="Navigation de l'espace">
      {items.map(({ href, Icon, t, badge }) => {
        const on = active(href);
        const n = badge ? counts[badge] : 0;
        return (
          <Link key={href} href={href} className={`relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${on ? "text-brand-600" : "text-ink-soft hover:bg-[#f6f8fe]"}`}>
            {on && <motion.span layoutId="side-pill" className="absolute inset-0 rounded-xl bg-brand-50" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
            <Icon size={18} className="relative" /><span className="relative">{t}</span>
            {n > 0 && <span className="relative ml-auto rounded-full bg-sun-400 px-2 text-xs font-bold text-ink">{n}</span>}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <SessionProvider user={user}>
      <ToastProvider>
        <div className="flex min-h-screen">
          <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col gap-5 overflow-y-auto border-r border-slate-200/70 bg-white px-4 py-6 lg:flex">
            <div className="px-2"><Brand /></div>
            {menu && <span className={`chip mx-2 self-start ${menu.tint}`}>{menu.label}</span>}
            {Nav}
            {user && ["eleve", "etudiant", "parent"].includes(user.role) && (
              <div className="mt-auto flex flex-col gap-2 rounded-[18px] bg-gradient-to-br from-brand-600 to-brand-400 p-4 text-white">
                <b>Besoin d&apos;aide ?</b><span className="text-xs text-brand-100">Échange avec un conseiller d&apos;orientation.</span>
                <Link href={user.role === "parent" ? "/parent/conseiller" : "/espace/conseiller"} className="btn-sun btn-shine py-2 text-[13px]">Prendre rendez-vous</Link>
              </div>
            )}
            {!user && <div className="mt-auto flex flex-col gap-2"><Link href="/connexion" className="btn-ghost">Se connecter</Link><Link href="/inscription" className="btn-primary">Créer un compte</Link></div>}
          </aside>
          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-40 flex h-[72px] items-center justify-between gap-4 border-b border-slate-200/70 bg-white/85 px-4 backdrop-blur-xl sm:px-8">
              <div className="flex items-center gap-2 lg:hidden"><button onClick={() => setOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f1f4fd]" aria-label="Menu"><Menu size={20} /></button><Brand /></div>
              <Link href="/recherche" className="hidden w-[420px] items-center gap-2.5 rounded-xl bg-[#f6f8fe] px-4 py-2.5 text-sm text-ink-mute hover:bg-brand-50 md:flex"><Search size={18} />Rechercher un métier, une formation, une école…</Link>
              {user ? (
                <div className="flex items-center gap-3">
                  <Link href="/notifications" aria-label={`Notifications${counts.notif ? ` (${counts.notif} non lues)` : ""}`} className="relative flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-[#f6f8fe]">
                    <Bell size={20} />{counts.notif > 0 && <><span className="absolute right-2.5 top-2.5 h-2 w-2 animate-ping rounded-full bg-[#ff3d7f]" /><span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#ff3d7f]" /></>}
                  </Link>
                  <div className="relative">
                    <button onClick={() => setUserMenu(!userMenu)} className="flex items-center gap-2.5 rounded-xl px-1.5 py-1 hover:bg-[#f6f8fe]" aria-expanded={userMenu}>
                      <Avatar name={`${user.firstName} ${user.lastName}`} size={40} />
                      <span className="hidden text-left sm:block"><b className="block text-sm">{user.firstName} {user.lastName}</b><span className="text-xs text-ink-mute">{ROLE_SUB[user.role]}{user.city ? ` · ${user.city}` : ""}</span></span>
                      <ChevronDown size={16} className="hidden text-ink-mute sm:block" />
                    </button>
                    <AnimatePresence>{userMenu && (
                      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute right-0 top-14 z-50 flex w-56 flex-col rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lift">
                        {["eleve", "etudiant"].includes(user.role) && <Link href="/espace/profil" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-[#f6f8fe]"><UserRound size={16} />Mon profil</Link>}
                        <Link href="/compte" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-[#f6f8fe]"><Settings2 size={16} />Compte et sécurité</Link>
                        <Link href="/" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-[#f6f8fe]"><House size={16} />Site public</Link>
                        <button onClick={logout} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#d42a50] hover:bg-[#fff1f3]"><LogOut size={16} />Se déconnecter</button>
                      </motion.div>
                    )}</AnimatePresence>
                  </div>
                </div>
              ) : <Link href="/connexion" className="btn-primary py-2.5">Se connecter</Link>}
            </header>
            <main className="flex-1 p-4 pb-24 sm:p-8 lg:pb-10">{children}</main>
          </div>
        </div>
        <AnimatePresence>{open && (
          <motion.div className="fixed inset-0 z-[80] bg-ink/40 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
            <motion.aside initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: "spring", stiffness: 300, damping: 32 }} onClick={(e) => e.stopPropagation()} className="flex h-full w-[280px] flex-col gap-5 overflow-y-auto bg-white p-5">
              <div className="flex items-center justify-between"><Brand /><button onClick={() => setOpen(false)} aria-label="Fermer le menu" className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f1f4fd]"><X size={18} /></button></div>
              {menu && <span className={`chip self-start ${menu.tint}`}>{menu.label}</span>}
              {Nav}
              {user && <button onClick={logout} className="mt-auto flex items-center gap-2 text-sm font-bold text-[#d42a50]"><LogOut size={16} />Se déconnecter</button>}
            </motion.aside>
          </motion.div>
        )}</AnimatePresence>
        <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-slate-200 bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 backdrop-blur lg:hidden" aria-label="Raccourcis">
          {items.slice(0, 4).map(({ href, Icon, t }) => (
            <Link key={href} href={href} className={`relative flex flex-col items-center gap-1 px-2 text-[11px] font-bold ${active(href) ? "text-brand-600" : "text-ink-mute"}`}>
              {active(href) && <motion.span layoutId="mob-pill" className="absolute -top-2 h-1 w-8 rounded-full bg-brand-600" />}<Icon size={22} />{short(t)}
            </Link>
          ))}
          <button onClick={() => setOpen(true)} className="flex flex-col items-center gap-1 px-2 text-[11px] font-bold text-ink-mute"><Menu size={22} />Menu</button>
        </nav>
      </ToastProvider>
    </SessionProvider>
  );
}
