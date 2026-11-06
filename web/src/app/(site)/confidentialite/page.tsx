import { LegalPage, legalMetadata } from "@/components/public/LegalPage";

export const metadata = legalMetadata("navigoal", "confidentialite");
export default function Page() { return <LegalPage service="navigoal" page="confidentialite" />; }
