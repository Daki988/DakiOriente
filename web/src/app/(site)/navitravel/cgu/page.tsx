import { LegalPage, legalMetadata } from "@/components/public/LegalPage";

export const metadata = legalMetadata("navitravel", "cgu");
export default function Page() { return <LegalPage service="navitravel" page="cgu" />; }
