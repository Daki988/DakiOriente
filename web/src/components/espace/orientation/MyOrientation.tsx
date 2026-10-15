"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Brain } from "lucide-react";
import { Alert, Empty, Loading } from "@/components/app/kit";
import { useApi } from "@/hooks/useApi";
import type { Reco } from "../Dashboard";
import { OrientationProfile } from "./OrientationProfile";

type Me = { profile: { riasec: { scores: Record<string, number>; top: string[] } | null } | null };
type Result = { id: string; createdAt: string; top: string[] };

export function MyOrientation() {
  const params = useSearchParams();
  const me = useApi<Me>("/moi");
  const hist = useApi<Result[]>("/orientation/resultats");
  const reco = useApi<Reco>("/recommandations");
  if (me.loading) return <Loading />;
  const r = me.data?.profile?.riasec;
  if (!r) return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[26px] font-extrabold tracking-tight sm:text-3xl">Mon profil d&apos;orientation</h1>
      <Empty icon={Brain} title="Tu n'as pas encore passé le test" text="Réponds à 10 questions en images : ton profil, tes traits, les domaines et les métiers qui te correspondent apparaîtront ici." action={<Link href="/orientation" className="btn-primary">Passer le test d&apos;orientation</Link>} />
    </div>
  );
  return (
    <div className="flex flex-col gap-4">
      {params.get("nouveau") && <Alert tone="success" title="Profil enregistré">Tes recommandations de formations, de métiers et d&apos;établissements sont à jour sur ton tableau de bord.</Alert>}
      <OrientationProfile scores={r.scores} top={r.top} date={hist.data?.[0]?.createdAt ?? null} reco={reco.data} />
      {(hist.data?.length ?? 0) > 1 && <p className="text-xs text-ink-mute">Tu as passé le test {hist.data!.length} fois ; seul le dernier résultat est utilisé pour tes recommandations.</p>}
    </div>
  );
}
