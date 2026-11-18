import type { Metadata } from "next";
import { OrientationTest } from "@/components/espace/orientation/OrientationTest";
import { SeriesExplorer } from "@/components/sections/SeriesExplorer";

export const metadata: Metadata = { title: "Test d'orientation gratuit en 5 minutes", description: "Test d'orientation gratuit en images, 5 minutes : découvre ton profil RIASEC, les métiers et les formations au Maroc qui te correspondent.", alternates: { canonical: "/orientation/" } };

export default function OrientationPage() {
  return (
    <div className="flex flex-col gap-8">
      <OrientationTest />
      <SeriesExplorer />
    </div>
  );
}
