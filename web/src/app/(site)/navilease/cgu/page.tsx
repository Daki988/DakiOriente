import { LegalPage, legalMetadata } from "@/components/public/LegalPage";

export const metadata = legalMetadata("navilease", "cgu");
export default function Page() { return <LegalPage service="navilease" page="cgu" />; }
