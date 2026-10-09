import type { Metadata } from "next";
import { LegalPage } from "@/components/public/LegalPage";

export const metadata: Metadata = { title: "Mentions légales" };
export default function Page() { return <LegalPage page="mentions-legales" />; }
