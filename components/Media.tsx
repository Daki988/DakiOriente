import Image from "next/image";
import { Placeholder } from "./Placeholder";

/** Affiche l'image optimisée si fournie, sinon un visuel provisoire. */
export function Media({
  src, alt, mood, className = "", sizes = "100vw", priority = false,
}: { src?: string | null; alt: string; mood?: string; className?: string; sizes?: string; priority?: boolean }) {
  if (!src) return <Placeholder mood={mood} label={alt} className={className} />;
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
    </div>
  );
}
