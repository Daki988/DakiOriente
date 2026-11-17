"use client";
// « Ce que Navi retient » : la fiche de suivi tenue par l'assistant d'une conversation à l'autre, visible et effaçable.
import { Bot, Trash2 } from "lucide-react";
import { Button, Panel, useToast } from "@/components/app/kit";
import { api } from "@/lib/api";
import { useAction, useApi } from "@/hooks/useApi";

export function SuiviNavi() {
  const toast = useToast();
  const s = useApi<{ suivi: { notes: string; le: string } | null }>("/moi/navi-suivi");
  const eff = useAction();
  const notes = s.data?.suivi?.notes;
  return (
    <Panel title="Ce que Navi retient" icon={Bot}>
      {notes ? (
        <>
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink-soft">{notes}</p>
          <p className="text-xs text-ink-mute">Mis à jour le {new Date(s.data!.suivi!.le).toLocaleDateString("fr-FR")}. Navi s&apos;en sert pour reprendre le fil de vos échanges ; ton conseiller Navigoal peut aussi le lire.</p>
          <Button type="button" variant="ghost" size="sm" icon={Trash2} loading={eff.pending} onClick={() => eff.run(async () => { await api("/moi/navi-suivi", { method: "DELETE" }); toast("Navi a tout oublié"); s.reload(); })}>Effacer</Button>
        </>
      ) : <p className="text-[13px] text-ink-mute">Rien pour l&apos;instant. Au fil de tes conversations, Navi note ton projet, tes pistes et ta prochaine étape pour reprendre là où vous vous étiez arrêtés.</p>}
    </Panel>
  );
}
