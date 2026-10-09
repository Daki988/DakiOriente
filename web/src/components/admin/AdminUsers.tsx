"use client";
import { Ban, Building2, CheckCircle2, RotateCcw, Search, ShieldCheck, UserPlus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, Button, Chip, Dialog, Loading, Panel, StatusBadge, Table, dateFr, since, useToast } from "@/components/app/kit";
import { Field, FormError, Input, PasswordInput, Select } from "@/components/app/form";
import { useAction, useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { useUser } from "@/components/app/Session";
import { AdminHeader, Confirm, Flag, LoadError, Pager, PAYS_OPTS, ROLE_LABEL, ROLE_OPTS, ROLE_TONE, Reveal, nf, qs, useDebounced } from "./shared";

type U = { id: string; firstName: string; lastName: string; email: string | null; phone: string | null; role: string; status: string; country: string | null; city: string | null; createdAt: string; lastLoginAt: string | null };
type Page = { rows: U[]; total: number; page: number };

export function AdminUsers() {
  const me = useUser();
  const toast = useToast();
  const [role, setRole] = useState("");
  const [pays, setPays] = useState("");
  const [statut, setStatut] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const dq = useDebounced(q.trim());
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("statut")) setStatut(p.get("statut")!);
    if (p.get("role")) setRole(p.get("role")!);
  }, []);
  useEffect(() => setPage(1), [role, pays, statut, dq]);

  const list = useApi<Page>(`/admin/utilisateurs${qs({ role, pays, statut, q: dq, page })}`);
  const pending = useApi<Page>("/admin/utilisateurs?role=etablissement&statut=en_attente");
  const stats = useApi<{ usersByRole: { role: string; n: number }[] }>("/admin/statistiques");
  const [target, setTarget] = useState<{ u: U; to: "actif" | "suspendu" } | null>(null);
  const [create, setCreate] = useState(false);
  const act = useAction();

  const apply = async () => {
    if (!target) return;
    const r = await act.run(() => api(`/admin/utilisateurs/${target.u.id}/statut`, { body: { statut: target.to } }));
    if (r) {
      toast(target.to === "actif" ? (target.u.status === "en_attente" ? "Compte validé et espace activé." : "Compte réactivé.") : "Compte suspendu, sessions fermées.");
      setTarget(null); list.reload(); pending.reload();
    }
  };
  const openTarget = (u: U, to: "actif" | "suspendu") => { act.setError(null); setTarget({ u, to }); };
  const total = stats.data?.usersByRole.reduce((t, r) => t + r.n, 0);
  const nPending = pending.data?.total ?? 0;

  return (
    <div className="min-w-0">
      <AdminHeader title="Utilisateurs" sub={<>{total != null ? `${nf(total)} comptes` : "Comptes"}{nPending ? ` · ${nPending} compte${nPending > 1 ? "s" : ""} établissement à valider` : ""}</>}
        actions={<Button className="!bg-ink hover:!bg-ink/90" icon={UserPlus} onClick={() => setCreate(true)}>Créer un compte interne</Button>} />

      <div className="mb-3 flex flex-col gap-2.5 md:flex-row md:flex-wrap">
        <label className="relative md:w-72">
          <span className="sr-only">Rechercher</span>
          <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, e-mail, téléphone…" className="pl-10" type="search" />
        </label>
        <div className="grid grid-cols-3 gap-2.5 md:flex">
          <Select aria-label="Rôle" value={role} onChange={(e) => setRole(e.target.value)} options={ROLE_OPTS} placeholder="Rôle" className="md:w-44" />
          <Select aria-label="Pays" value={pays} onChange={(e) => setPays(e.target.value)} options={PAYS_OPTS} placeholder="Pays" className="md:w-40" />
          <Select aria-label="Statut" value={statut} onChange={(e) => setStatut(e.target.value)} options={[["actif", "Actif"], ["en_attente", "À valider"], ["suspendu", "Suspendu"]]} placeholder="Statut" className="md:w-40" />
        </div>
      </div>
      {stats.data && (
        <div className="mb-5 flex flex-wrap gap-2" aria-label="Filtrer par rôle">
          {stats.data.usersByRole.sort((a, b) => b.n - a.n).map((r) => (
            <button key={r.role} onClick={() => setRole(role === r.role ? "" : r.role)} aria-pressed={role === r.role}
              className={`rounded-full border px-3.5 py-1.5 text-[13px] font-bold transition ${role === r.role ? "border-ink bg-ink text-white" : "border-slate-200 bg-white text-ink hover:border-brand-300"}`}>
              {ROLE_LABEL[r.role] ?? r.role} <span className={role === r.role ? "text-white/70" : "text-ink-mute"}>{nf(r.n)}</span>
            </button>
          ))}
          {(role || pays || statut || q) && <button onClick={() => { setRole(""); setPays(""); setStatut(""); setQ(""); }} className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[13px] font-bold text-brand-600"><X size={14} />Réinitialiser</button>}
        </div>
      )}

      <div className="grid items-start gap-5 [&>*]:min-w-0 2xl:grid-cols-[1fr_340px]">
        <Panel className="!gap-3 2xl:order-1">
          {list.error ? <LoadError error={list.error} reload={list.reload} /> : list.loading && !list.data ? <Loading /> : list.data && (
            <>
              <Table rows={list.data.rows} rowKey={(u) => u.id} empty="Aucun compte ne correspond à ces filtres." cols={[
                { h: "Utilisateur", c: (u) => (
                  <div className="flex items-center gap-3">
                    <Avatar name={`${u.firstName} ${u.lastName}`} size={36} />
                    <div className="flex min-w-0 flex-col"><b className="truncate">{u.firstName} {u.lastName}</b><span className="truncate text-xs text-ink-mute">{u.email ?? u.phone ?? "—"}</span></div>
                  </div>) },
                { h: "Rôle", c: (u) => <Chip tone={ROLE_TONE[u.role]}>{ROLE_LABEL[u.role] ?? u.role}</Chip> },
                { h: "Pays", c: (u) => <Flag code={u.country} /> },
                { h: "Connexion", c: (u) => <span className="flex flex-col whitespace-nowrap"><span>{u.lastLoginAt ? since(u.lastLoginAt) : "Jamais"}</span><span className="text-xs text-ink-mute">inscrit le {dateFr(u.createdAt)}</span></span> },
                { h: "Statut", c: (u) => u.status === "en_attente" ? <Chip tone="sun">À valider</Chip> : <StatusBadge status={u.status} /> },
                { h: <span className="sr-only">Actions</span>, className: "text-right", c: (u) => u.id === me?.id ? <span className="text-xs text-ink-mute">Vous</span> : (
                  <div className="flex justify-end gap-1.5">
                    {u.status === "en_attente" && <Button size="sm" className="!bg-[#6a3df0] hover:!bg-[#5a2fe0]" onClick={() => openTarget(u, "actif")}>Valider</Button>}
                    {u.status === "suspendu"
                      ? <IconBtn label={`Réactiver ${u.firstName} ${u.lastName}`} onClick={() => openTarget(u, "actif")} className="text-[#0f8a46]"><RotateCcw size={16} /></IconBtn>
                      : <IconBtn label={`${u.status === "en_attente" ? "Refuser" : "Suspendre"} ${u.firstName} ${u.lastName}`} onClick={() => openTarget(u, "suspendu")} className="text-[#d42a50]"><Ban size={16} /></IconBtn>}
                  </div>) },
              ]} />
              <Pager page={list.data.page} total={list.data.total} size={50} onPage={setPage} />
            </>
          )}
        </Panel>

        <div className={`flex flex-col gap-5 2xl:order-2 ${nPending ? "order-first" : ""}`}>
          <Panel title="Comptes établissement à valider" icon={Building2} className="border-[#d9cffc]" action={nPending ? <Chip tone="violet">{nPending}</Chip> : undefined}>
            {pending.loading && !pending.data ? <Loading /> : pending.error ? <LoadError error={pending.error} reload={pending.reload} /> : !pending.data?.rows.length ? (
              <p className="flex items-center gap-2 text-sm text-ink-mute"><CheckCircle2 size={17} className="text-[#0f8a46]" />Aucune demande en attente.</p>
            ) : (
              <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-1">
                {pending.data.rows.map((u, i) => (
                  <Reveal key={u.id} i={i} as="li" className="flex flex-col gap-2.5 rounded-2xl border border-slate-200/80 p-3.5">
                      <div className="flex items-center gap-3"><Avatar name={`${u.firstName} ${u.lastName}`} size={34} /><div className="min-w-0"><b className="block truncate text-sm">{u.firstName} {u.lastName}</b><span className="block truncate text-xs text-ink-mute">{u.email ?? u.phone}</span></div></div>
                      <ul className="flex flex-col gap-1 text-xs text-ink-soft">
                        <li className="flex items-center gap-1.5"><Check ok={!!u.email && !/@(gmail|yahoo|hotmail|outlook)\./i.test(u.email)} />{u.email && /@(gmail|yahoo|hotmail|outlook)\./i.test(u.email) ? "E-mail sur domaine générique : contrôle renforcé" : "E-mail sur un domaine institutionnel"}</li>
                        <li className="flex items-center gap-1.5"><Check ok={!!u.phone} />{u.phone ? `Téléphone ${u.phone}` : "Téléphone non renseigné"}</li>
                        <li className="flex items-center gap-1.5">{u.country && <><Flag code={u.country} withName />{u.city ? ` · ${u.city}` : ""} ·</>} demande {since(u.createdAt)}</li>
                      </ul>
                      <div className="flex gap-2"><Button size="sm" className="flex-1 !bg-[#0f8a46] hover:!bg-[#0b7a3c]" icon={ShieldCheck} onClick={() => openTarget(u, "actif")}>Valider</Button><Button size="sm" variant="ghost" className="!border-[#ffd0d9] !text-[#d42a50]" onClick={() => openTarget(u, "suspendu")}>Refuser</Button></div>
                  </Reveal>
                ))}
              </ul>
            )}
            <p className="text-xs text-ink-mute">La validation active l&apos;espace établissement, attribue le badge « vérifié » à l&apos;établissement rattaché et est journalisée dans l&apos;audit.</p>
          </Panel>
        </div>
      </div>

      <Confirm open={!!target} onClose={() => setTarget(null)} onConfirm={apply} pending={act.pending} error={act.error}
        tone={target?.to === "suspendu" ? "danger" : "primary"}
        title={!target ? "" : target.to === "suspendu" ? (target.u.status === "en_attente" ? "Refuser ce compte ?" : "Suspendre ce compte ?") : target.u.status === "en_attente" ? "Valider ce compte établissement ?" : "Réactiver ce compte ?"}
        confirm={!target ? "" : target.to === "suspendu" ? (target.u.status === "en_attente" ? "Refuser" : "Suspendre") : target.u.status === "en_attente" ? "Valider le compte" : "Réactiver"}>
        {target && (
          <>
            <p className="mb-2"><b>{target.u.firstName} {target.u.lastName}</b> · {ROLE_LABEL[target.u.role]} · {target.u.email ?? target.u.phone}</p>
            {target.to === "suspendu"
              ? <p>L&apos;utilisateur sera déconnecté immédiatement et ne pourra plus se connecter tant que le compte restera suspendu. L&apos;action est journalisée.</p>
              : target.u.role === "etablissement" && target.u.status === "en_attente"
                ? <p>L&apos;espace établissement sera activé, l&apos;établissement passera au statut « vérifié » et le demandeur sera notifié.</p>
                : <p>L&apos;utilisateur pourra de nouveau se connecter.</p>}
          </>
        )}
      </Confirm>
      <CreateStaff open={create} onClose={() => setCreate(false)} onDone={() => { setCreate(false); list.reload(); stats.reload(); }} />
    </div>
  );
}

const Check = ({ ok }: { ok: boolean }) => ok ? <CheckCircle2 size={14} className="shrink-0 text-[#0f8a46]" /> : <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 border-[#f0a400] text-[8px] font-black text-[#a55a00]">!</span>;

const IconBtn = ({ label, onClick, children, className = "" }: { label: string; onClick: () => void; children: React.ReactNode; className?: string }) => (
  <button onClick={onClick} aria-label={label} title={label} className={`flex h-9 w-9 items-center justify-center rounded-xl bg-[#f3f5fb] transition hover:bg-[#e8ecf8] ${className}`}>{children}</button>
);

function CreateStaff({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const act = useAction();
  const blank = { role: "conseiller", firstName: "", lastName: "", email: "", password: "" };
  const [f, setF] = useState(blank);
  const [errs, setErrs] = useState<Record<string, string>>({});
  useEffect(() => { if (open) { setF(blank); setErrs({}); act.setError(null); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!f.firstName.trim()) er.firstName = "Prénom obligatoire.";
    if (!f.lastName.trim()) er.lastName = "Nom obligatoire.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) er.email = "Adresse e-mail invalide.";
    if (f.password.length < 8 || !/[A-Za-z]/.test(f.password) || !/\d/.test(f.password)) er.password = "8 caractères minimum, avec au moins une lettre et un chiffre.";
    setErrs(er);
    if (Object.keys(er).length) return;
    const r = await act.run(() => api("/admin/utilisateurs", { body: { ...f, firstName: f.firstName.trim(), lastName: f.lastName.trim(), email: f.email.trim() } }));
    if (r) { toast(`Compte ${f.role === "admin" ? "administrateur" : "conseiller"} créé.`); onDone(); }
  };
  return (
    <Dialog open={open} onClose={onClose} title="Créer un compte interne">
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <Field label="Rôle" required>{(id) => <Select id={id} value={f.role} onChange={set("role")} options={[["conseiller", "Conseiller d'orientation"], ["admin", "Administrateur"]]} />}</Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prénom" required error={errs.firstName}>{(id) => <Input id={id} value={f.firstName} onChange={set("firstName")} autoComplete="off" />}</Field>
          <Field label="Nom" required error={errs.lastName}>{(id) => <Input id={id} value={f.lastName} onChange={set("lastName")} autoComplete="off" />}</Field>
        </div>
        <Field label="E-mail professionnel" required error={errs.email}>{(id) => <Input id={id} type="email" value={f.email} onChange={set("email")} placeholder="prenom.nom@navigoal.com" autoComplete="off" />}</Field>
        <Field label="Mot de passe provisoire" required error={errs.password} hint="À transmettre par un canal sûr.">{(id) => <PasswordInput id={id} value={f.password} onChange={set("password")} autoComplete="new-password" />}</Field>
        <FormError error={act.error} />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="quiet" onClick={onClose}>Annuler</Button><Button type="submit" loading={act.pending} icon={UserPlus}>Créer le compte</Button></div>
      </form>
    </Dialog>
  );
}
