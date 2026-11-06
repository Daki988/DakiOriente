import { LegalPage, legalMetadata } from "@/components/public/LegalPage";

export const metadata = legalMetadata("navilease", "mentions-legales");
export default function Page() { return <LegalPage service="navilease" page="mentions-legales" />; }
