import { LegalPage, legalMetadata } from "@/components/public/LegalPage";

export const metadata = legalMetadata("navigoal", "cookies");
export default function Page() { return <LegalPage service="navigoal" page="cookies" />; }
