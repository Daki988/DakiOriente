import type { Metadata } from "next";
import { LegalPage } from "@/components/public/LegalPage";

export const metadata: Metadata = { title: "Politique de confidentialité" };
export default function Page() { return <LegalPage page="confidentialite" />; }
