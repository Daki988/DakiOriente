import { chiffres } from "@/lib/queries";

export function DemoBanner() {
  if (chiffres().demo === 0) return null;
  return (
    <div className="bg-alerte-100 text-alerte-600">
      <p className="conteneur py-2 text-center text-xs font-semibold sm:text-sm">
        Mode démonstration : les transitaires marqués « démo » sont fictifs et servent uniquement à tester la plateforme.
      </p>
    </div>
  );
}
