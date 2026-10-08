import type { Metadata } from "next";
import { OrientationTest } from "@/components/sections/OrientationTest";
import { SeriesExplorer } from "@/components/sections/SeriesExplorer";

export const metadata: Metadata = { title: "Test d'orientation", description: "Découvre ton profil RIASEC, les métiers et les formations qui te correspondent." };

export default function OrientationPage() {
  return (
    <>
      <OrientationTest />
      <SeriesExplorer />
    </>
  );
}
