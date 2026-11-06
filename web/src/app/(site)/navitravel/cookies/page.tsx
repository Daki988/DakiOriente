import { LegalPage, legalMetadata } from "@/components/public/LegalPage";

export const metadata = legalMetadata("navitravel", "cookies");
export default function Page() { return <LegalPage service="navitravel" page="cookies" />; }
