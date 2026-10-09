import type { Metadata } from "next";
import { LegalPage } from "@/components/public/LegalPage";

export const metadata: Metadata = { title: "Conditions générales d'utilisation" };
export default function Page() { return <LegalPage page="cgu" />; }
