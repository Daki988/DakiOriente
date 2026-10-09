"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { EtabPhoto } from "@/components/ui/EtabPhoto";
import { etabById } from "@/lib/data";

const SLOTS = [
  { cls: "left-0 top-[30px] h-[200px] w-[46%]", depth: 40 },
  { cls: "left-[48%] top-0 h-[220px] w-[42%]", depth: -30 },
  { cls: "left-[22%] top-[250px] h-[200px] w-[46%]", depth: 60 },
  { cls: "left-[68%] top-[220px] h-[170px] w-[31%]", depth: -50 },
];

/** Collage de photos d'établissements : apparition décalée + parallaxe au scroll. */
export function PhotoCollage({ ids }: { ids: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const ys = [useTransform(scrollYProgress, [0, 1], [SLOTS[0].depth, -SLOTS[0].depth]), useTransform(scrollYProgress, [0, 1], [SLOTS[1].depth, -SLOTS[1].depth]),
    useTransform(scrollYProgress, [0, 1], [SLOTS[2].depth, -SLOTS[2].depth]), useTransform(scrollYProgress, [0, 1], [SLOTS[3].depth, -SLOTS[3].depth])];
  return (
    <div ref={ref} className="relative hidden h-[460px] lg:block">
      {ids.slice(0, 4).map((id, k) => (
        <motion.div key={id} className={`absolute ${SLOTS[k].cls}`} style={{ y: ys[k] }} initial={{ opacity: 0, scale: 0.9, rotate: k % 2 ? 3 : -3 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ delay: 0.15 + k * 0.12, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
          <EtabPhoto e={etabById[id]} rounded="rounded-[22px]" className="h-full w-full border-[5px] border-white shadow-[0_30px_60px_-24px_rgba(11,21,51,.45)]" />
        </motion.div>
      ))}
    </div>
  );
}
