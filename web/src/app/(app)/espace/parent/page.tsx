import type { Metadata } from "next";
import { EspaceParent } from "@/components/sections/EspaceParent";

export const metadata: Metadata = { title: "Espace parent" };

export default function ParentPage() {
  return <EspaceParent />;
}
