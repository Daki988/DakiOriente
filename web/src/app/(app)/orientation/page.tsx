import type { Metadata } from "next";
import { OrientationTest } from "@/components/espace/orientation/OrientationTest";
import { SeriesExplorer } from "@/components/sections/SeriesExplorer";

export const metadata: Metadata = { title: "Test d'orientation", description: "Test d'orientation en images : découvre ton profil RIASEC, les métiers et les formations au Maroc qui te correspondent." };

export default function OrientationPage() {
  return (
    <div className="flex flex-col gap-8">
      <OrientationTest />
      <SeriesExplorer />
    </div>
  );
}
