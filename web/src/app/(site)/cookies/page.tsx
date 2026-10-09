import type { Metadata } from "next";
import { LegalPage } from "@/components/public/LegalPage";

export const metadata: Metadata = { title: "Cookies" };
export default function Page() { return <LegalPage page="cookies" />; }
