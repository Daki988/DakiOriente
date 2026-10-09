import { Suspense } from "react";
import { Loading } from "@/components/app/kit";
import { EcoleProvider } from "@/components/etablissement/EcoleContext";
import { requireRole } from "@/server/session-ui";

export const dynamic = "force-dynamic";

export default async function EtablissementLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["etablissement", "admin"], "/etablissement");
  return (
    <Suspense fallback={<Loading />}>
      <EcoleProvider>{children}</EcoleProvider>
    </Suspense>
  );
}
