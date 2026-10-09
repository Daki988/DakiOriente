"use client";
import { useRef, useState } from "react";
import type { GalleryItem } from "@/lib/content";
import { Media } from "./Media";
import { IconClose } from "./Icons";

/** Galerie en mosaïque + visionneuse accessible (<dialog> natif : focus et Échap gérés par le navigateur). */
export function Gallery({ items }: { items: GalleryItem[] }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [current, setCurrent] = useState<GalleryItem | null>(null);
  const open = (it: GalleryItem) => { setCurrent(it); ref.current?.showModal(); };

  return (
    <>
      <ul className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
        {items.map((it, i) => (
          <li key={i} className={`reveal ${i % 5 === 0 ? "col-span-2 row-span-2" : ""}`}>
            <button
              onClick={() => open(it)}
              className="group block h-full w-full overflow-hidden rounded-2xl text-left"
              aria-label={`Agrandir : ${it.alt}`}
            >
              <Media src={it.src} alt={it.alt} mood={it.mood} className={`h-full w-full transition duration-500 group-hover:scale-[1.03] ${i % 5 === 0 ? "aspect-square" : "aspect-[4/5]"}`} sizes="(min-width:768px) 25vw, 50vw" />
            </button>
          </li>
        ))}
      </ul>
      <dialog
        ref={ref}
        onClose={() => setCurrent(null)}
        onClick={(e) => e.target === ref.current && ref.current?.close()}
        className="m-auto w-[min(92vw,960px)] rounded-3xl bg-transparent p-0 text-text backdrop:bg-black/85"
      >
        {current && (
          <figure className="relative">
            <Media src={current.src} alt={current.alt} mood={current.mood} className="aspect-[4/3] w-full rounded-3xl" sizes="92vw" />
            <figcaption className="mt-3 text-center text-sm text-muted">{current.caption}</figcaption>
            <button
              onClick={() => ref.current?.close()}
              className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-black/70"
              aria-label="Fermer"
              autoFocus
            >
              <IconClose />
            </button>
          </figure>
        )}
      </dialog>
    </>
  );
}
