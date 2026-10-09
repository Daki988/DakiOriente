import { CheckCircle2, KeyRound, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/ui/Brand";

/** Panneau visuel des pages de connexion (maquette 17). */
export function AuthAside() {
  return (
    <aside className="relative hidden min-h-screen flex-col overflow-hidden bg-gradient-to-br from-brand-950 via-brand-700 to-brand-500 p-12 text-white lg:flex">
      <div className="absolute -right-20 -top-24 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(255,194,31,.35),transparent_70%)]" />
      <div className="relative [&_span]:!text-white"><Brand dark /></div>
      <h2 className="relative mt-12 text-[40px] font-extrabold leading-tight tracking-tight">Ton avenir commence <span className="!text-sun-400">ici.</span></h2>
      <p className="relative mt-4 max-w-md text-[17px] text-brand-100">Orientation, formations, candidatures et logement étudiant : retrouve tout ton parcours, sur ordinateur ou sur ton téléphone.</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/etudiante.webp" alt="" className="absolute bottom-0 left-1/2 w-[440px] -translate-x-1/2" />
      {[
        { I: CheckCircle2, t: "Candidature acceptée 🎉", s: "ESA Casablanca · Bachelor business", c: "bg-[#e8f8ef] text-[#0f8a46]", pos: "top-[330px] left-10" },
        { I: ShieldCheck, t: "Paiement protégé", s: "Airtel Money · Wave · Orange Money", c: "bg-sun-100 text-[#a55a00]", pos: "top-[470px] right-8" },
        { I: KeyRound, t: "Studio vérifié à 8 min de ton école", s: "", c: "bg-sun-400 text-ink", pos: "bottom-14 left-14" },
      ].map(({ I, t, s, c, pos }) => (
        <div key={t} className={`absolute ${pos} z-10 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-ink shadow-lift`}>
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${c}`}><I size={19} /></span>
          <span><b className="block text-sm">{t}</b>{s && <span className="text-xs text-ink-mute">{s}</span>}</span>
        </div>
      ))}
    </aside>
  );
}
