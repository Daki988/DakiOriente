import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { NewsCard } from "@/components/ui/NewsCard";
import { CtaBand } from "@/components/ui/CtaBand";
import { Stagger, StaggerItem } from "@/components/motion/Reveal";
import { articleCards } from "@/server/content-ui";

export const metadata: Metadata = { title: "Actualités", description: "Bourses, concours, orientation et vie étudiante en Afrique." };
export const revalidate = 300;

export default async function ActualitesPage() {
  const items = await articleCards();
  return (
    <>
      <PageHero crumb="Actualités" title="Actualités" sub="Reste informé sur l'éducation, l'orientation, les formations et les opportunités en Afrique." hand="Toute l'actualité éducative en Afrique." />
      <div className="container">
        <Stagger className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => <StaggerItem key={a.slug}><NewsCard a={a} /></StaggerItem>)}
        </Stagger>
      </div>
      <CtaBand />
    </>
  );
}
