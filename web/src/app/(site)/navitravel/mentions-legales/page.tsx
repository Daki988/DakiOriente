import { LegalPage, legalMetadata } from "@/components/public/LegalPage";

export const metadata = legalMetadata("navitravel", "mentions-legales");
export default function Page() { return <LegalPage service="navitravel" page="mentions-legales" />; }
