import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { PiedSelonService } from "@/components/ui/Services";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="print:hidden"><Header /></div>
      <main>{children}</main>
      <div className="print:hidden"><PiedSelonService><Footer /></PiedSelonService></div>
    </>
  );
}
