"use client";
import { motion, useInView, type Variants } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

// Animations d'apparition, sans jamais cacher le haut de page en attendant le JavaScript :
// le HTML du serveur est rendu visible (le navigateur peint tout de suite le titre et la photo principale,
// ce que Google mesure avec le LCP). Après chargement, seuls les blocs encore sous l'écran sont masqués
// d'un coup, puis apparaissent quand on fait défiler la page. Les titres apparaissent en CSS (globals.css).

const ease = [0.16, 1, 0.3, 1] as const;
const useAvantPeinture = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** « show » au premier affichage ; « hidden » pour un bloc situé sous l'écran, jusqu'à ce qu'il y entre. */
function useApparition(marge: `${number}px`) {
  const ref = useRef<HTMLDivElement>(null);
  const vu = useInView(ref, { once: true, margin: marge });
  const [sousLEcran, setSousLEcran] = useState(false);
  useAvantPeinture(() => {
    const r = ref.current?.getBoundingClientRect();
    if (r && r.top > window.innerHeight) setSousLEcran(true);
  }, []);
  return { ref, etat: !sousLEcran || vu ? ("show" as const) : ("hidden" as const) };
}

export function Reveal({ children, delay = 0, y = 32, className, id }: { children: ReactNode; delay?: number; y?: number; className?: string; id?: string }) {
  const { ref, etat } = useApparition("-80px");
  return (
    <motion.div
      ref={ref}
      className={className}
      id={id}
      initial={false}
      animate={etat === "show" ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={etat === "show" ? { duration: 0.7, delay, ease } : { duration: 0 }}
    >
      {children}
    </motion.div>
  );
}

const container: Variants = { hidden: { transition: { staggerChildren: 0 } }, show: { transition: { staggerChildren: 0.08 } } };
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 28, transition: { duration: 0 } },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 20 } },
};

export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  const { ref, etat } = useApparition("-60px");
  return (
    <motion.div ref={ref} className={className} variants={container} initial={false} animate={etat}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <motion.div className={className} style={style} variants={staggerItem}>
      {children}
    </motion.div>
  );
}

/** Titre révélé mot par mot (translate + flou), en CSS : visible sans attendre le JavaScript. */
export function WordsReveal({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((w, i) => (
        <span key={i} className="anim-mot inline-block whitespace-pre" style={{ animationDelay: `${delay + i * 0.06}s` }}>
          {w + (i < words.length - 1 ? " " : "")}
        </span>
      ))}
    </span>
  );
}

/** Apparition simple (compatible avec les textes en dégradé, qui ne supportent pas le découpage mot par mot). */
export function FadeIn({ children, className, delay = 0.3 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <span className={`anim-apparition ${className ?? ""}`} style={{ animationDelay: `${delay}s` }}>
      {children}
    </span>
  );
}

/** Faux au premier rendu (HTML du serveur, hydratation), vrai ensuite : pour n'animer l'arrivée des cartes d'une
 *  liste qu'après un changement de filtre, pas au chargement de la page (cartes visibles sans attendre le JavaScript). */
export function useApresPremierRendu() {
  const [pret, setPret] = useState(false);
  useEffect(() => setPret(true), []);
  return pret;
}
