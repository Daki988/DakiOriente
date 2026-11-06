import { LegalPage, legalMetadata } from "@/components/public/LegalPage";

export const metadata = legalMetadata("navilease", "cookies");
export default function Page() { return <LegalPage service="navilease" page="cookies" />; }
