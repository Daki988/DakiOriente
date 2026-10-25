"use client";

import { Suspense, type ComponentProps } from "react";
import { useSearchParams } from "next/navigation";
import { OrderFlow } from "@/components/OrderFlow";

type Props = Omit<ComponentProps<typeof OrderFlow>, "initialQty" | "startDesign">;

function FromUrl(props: Props) {
  const sp = useSearchParams();
  const q = sp.get("q"), creer = sp.get("creer");
  return <OrderFlow key={`${q ?? ""}-${creer ?? ""}`} {...props} startDesign={creer === "1"} initialQty={q ? Number(q) : undefined} />;
}

/**
 * Commande avec la quantité (`?q=`) et l'ouverture de l'éditeur (`?creer=1`) lues dans l'adresse,
 * côté navigateur : la page reste statique (hébergement sans serveur Node possible).
 */
export function OrderFromUrl(props: Props) {
  return <Suspense fallback={<OrderFlow {...props} />}><FromUrl {...props} /></Suspense>;
}
