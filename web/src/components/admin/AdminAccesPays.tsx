"use client";
// Accès par pays : visiteurs, élèves et parents limités aux pays choisis ; comptes pros partout (voir services/acces-pays.ts).
import { Globe2, Plus, ShieldCheck, UserCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, Button, Loading, Panel, useToast } from "@/components/app/kit";
import { FormError } from "@/components/app/form";
import { api } from "@/lib/api";
import { useAction, useApi } from "@/hooks/useApi";
import { AdminHeader, Flag, LoadError, PAYS, PAYS_OPTS, Toggle } from "./shared";

type Reglage = { actif: boolean; pays: string[] };

export function AdminAccesPays() {
  const toast = useToast();
  const r = useApi<Reglage>("/admin/acces-pays");
  const [f, setF] = useState<Reglage | null>(null);
  const [ajout, setAjout] = useState("");
  const save = useAction();
  useEffect(() => { if (r.data) setF(r.data); }, [r.data]);
  if (r.error) return <LoadError error={r.error} reload={r.reload} />;
  if (!f) return <Loading />;
  const ajouter = () => { if (ajout && !f.pays.includes(ajout)) setF({ ...f, pays: [...f.pays, ajout] }); setAjout(""); };
  const retirer = (c: string) => setF({ ...f, pays: f.pays.filter((p) => p !== c) });
  const enregistrer = () => save.run(async () => {
    const v = await api<Reglage>("/admin/acces-pays", { method: "PUT", body: f });
    r.setData(v); toast(v.actif ? "Accès limité aux pays choisis" : "Plateforme ouverte à tous les pays");
  });
  const noms = f.pays.map((c) => PAYS[c] ?? c).join(", ");

  return (
    <div className="min-w-0">
      <AdminHeader title="Accès par pays" sub="Pays depuis lesquels les visiteurs, élèves et parents peuvent utiliser Navigoal" />
      <div className="mb-4">
        {f.actif
          ? <Alert tone="success" title="Filtre actif">Seuls les visiteurs connectés depuis : {noms || "aucun pays"} peuvent utiliser la plateforme.</Alert>
          : <Alert tone="warn" title="Filtre désactivé">Navigoal est accessible depuis tous les pays.</Alert>}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Pays autorisés" icon={Globe2} action={<Toggle on={f.actif} onChange={(v) => setF({ ...f, actif: v })} label="Limiter l'accès aux pays choisis" />}>
          <p className="text-[13px] text-ink-mute">Le pays est déterminé par l&apos;adresse internet du visiteur. Un visiteur d&apos;un autre pays voit une page « Navigoal n&apos;est pas encore disponible dans votre pays ».</p>
          <ul className="flex flex-wrap gap-2">
            {f.pays.map((c) => (
              <li key={c} className="chip bg-brand-50 text-brand-800">
                <Flag code={c} withName />
                <button type="button" onClick={() => retirer(c)} className="ml-1 rounded-full p-0.5 hover:bg-white" aria-label={`Retirer ${PAYS[c] ?? c}`}><X size={13} /></button>
              </li>
            ))}
            {!f.pays.length && <li className="text-sm text-[#d42a50]">Ajoutez au moins un pays.</li>}
          </ul>
          <div className="flex flex-wrap gap-2">
            <select className="input min-w-0 flex-1" value={ajout} onChange={(e) => setAjout(e.target.value)} aria-label="Pays à ajouter">
              <option value="">Choisir un pays…</option>
              {PAYS_OPTS.filter(([c]) => !f.pays.includes(c)).map(([c, n]) => <option key={c} value={c}>{n}</option>)}
            </select>
            <Button variant="ghost" icon={Plus} onClick={ajouter} disabled={!ajout}>Ajouter</Button>
          </div>
        </Panel>

        <Panel title="Toujours autorisés, depuis tous les pays" icon={UserCheck}>
          <ul className="space-y-2 text-sm">
            <li><b>Écoles, bailleurs, conseillers et administrateurs</b>, une fois connectés : la page de connexion reste ouverte à tous.</li>
            <li><b>Moteurs de recherche</b> (Google, Bing) : Navigoal reste trouvable dans les résultats.</li>
            <li><b>Pages légales</b> (CGU, confidentialité, mentions légales) et retours des passerelles de paiement.</li>
          </ul>
          <p className="flex items-start gap-2 text-[13px] text-ink-mute"><ShieldCheck size={15} className="mt-0.5 shrink-0" />Un visiteur qui passe par un VPN situé dans un pays autorisé n&apos;est pas détecté. Quand le filtre est actif, les pages ne sont plus gardées par le cache de l&apos;hébergeur : le site est un peu plus lent.</p>
        </Panel>
      </div>
      <FormError error={save.error} />
      <div className="mt-5 flex justify-end"><Button onClick={enregistrer} loading={save.pending} disabled={!f.pays.length}>Enregistrer</Button></div>
    </div>
  );
}
