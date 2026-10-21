import Link from "@/components/ui/Link";

/** Symbole Navigoal : le « N » parcouru par l'étudiant, jusqu'au point d'arrivée. */
export function BrandMark({ size = 38 }: { size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/brand/navigoal-mark-96.png" alt="" width={size} height={size} className="shrink-0 object-contain" style={{ width: size, height: size }} aria-hidden />;
}

export function Brand({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="Navigoal, accueil">
      <BrandMark size={42} />
      {dark ? (
        <span className="text-[21px] font-extrabold tracking-tight text-white">
          Navi<span className="text-sun-400">goal</span>
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/brand/navigoal-wordmark-ui.png" alt="Navigoal" width={120} height={27} className="h-[27px] w-auto" />
      )}
    </Link>
  );
}
