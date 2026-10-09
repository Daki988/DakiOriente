import type { Metadata } from "next";
import { Suspense } from "react";
import { NewApplication } from "@/components/espace/NewApplication";

export const metadata: Metadata = { title: "Nouvelle candidature" };
export default function Page() { return <Suspense><NewApplication /></Suspense>; }
