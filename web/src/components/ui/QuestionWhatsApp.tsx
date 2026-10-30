"use client";
import { MessageCircle } from "lucide-react";
import Link from "@/components/ui/Link";
import { usePathname } from "next/navigation";
import { useApi } from "@/hooks/useApi";

/**
 * « Une question ? » : ouvre WhatsApp vers un conseiller, avec un message prérempli qui cite la page.
 * Numéro lu à l'exécution (WHATSAPP_CONSEILLER, via /api/contact) : rien ne s'affiche tant qu'il n'est pas configuré.
 * Mobile : barre collante en bas de page (avec l'action principale de la page) ; ordinateur : bouton flottant.
 */
export function QuestionWhatsApp({ sujet, cta }: { sujet: string; cta?: { href: string; label: string } }) {
  const { data } = useApi<{ whatsapp: string | null }>("/contact");
  const path = usePathname();
  if (!data?.whatsapp) return null;
  const page = typeof window === "undefined" ? path : window.location.origin + path;
  const href = `https://wa.me/${data.whatsapp}?text=${encodeURIComponent(`Bonjour, j'ai une question sur ${sujet} (${page})`)}`;
  const bouton = (cls: string) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] font-extrabold text-ink ${cls}`}>
      <MessageCircle size={18} aria-hidden />Une question ?
    </a>
  );
  return (
    <>
      <div className="sticky bottom-0 z-20 mt-6 flex gap-2.5 border-t border-slate-200/70 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        {cta && <Link href={cta.href} className="btn-primary min-h-[46px] flex-1">{cta.label}</Link>}
        {bouton(`min-h-[46px] px-4 text-[15px] ${cta ? "" : "flex-1"}`)}
      </div>
      <div className="fixed bottom-6 right-[96px] z-30 hidden lg:block">{bouton("px-5 py-3.5 text-[15px] shadow-[0_12px_30px_-10px_rgba(11,21,51,.45)]")}</div>
    </>
  );
}
