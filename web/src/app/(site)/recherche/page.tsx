import type { Metadata } from "next";
import { Suspense } from "react";
import { GlobalSearch } from "@/components/public/Search";

export const metadata: Metadata = { title: "Recherche" };
export default function Page() { return <Suspense><GlobalSearch /></Suspense>; }
