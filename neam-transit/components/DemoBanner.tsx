import { chiffres } from "@/lib/queries";
import { pret } from "@/lib/stockage";

export async function DemoBanner() {
  await pret();
  if (chiffres().demo === 0) return null;
  return (
    <div className="bg-alerte-100 text-alerte-600">
      <p className="conteneur py-2 text-center text-xs font-semibold sm:text-sm">
        Mode démonstration : les transitaires marqués « démo » sont fictifs et servent uniquement à tester la plateforme.
        {process.env.NEAM_DATA_DIR?.startsWith("/tmp") && process.env.NEAM_STOCKAGE !== "blobs" && " Les données saisies sont temporaires et peuvent être effacées."}
      </p>
    </div>
  );
}
