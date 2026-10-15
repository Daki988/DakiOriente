import type { Metadata } from "next";
import { Suspense } from "react";
import { MyOrientation } from "@/components/espace/orientation/MyOrientation";

export const metadata: Metadata = { title: "Mon profil d'orientation" };
export default function Page() { return <Suspense><MyOrientation /></Suspense>; }
