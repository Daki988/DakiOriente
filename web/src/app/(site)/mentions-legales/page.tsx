import { LegalPage, legalMetadata } from "@/components/public/LegalPage";

export const metadata = legalMetadata("navigoal", "mentions-legales");
export default function Page() { return <LegalPage service="navigoal" page="mentions-legales" />; }
