import { type ImageShape, NO_FILTERS, uid } from "./types";

/** Lit un fichier image et le réduit si besoin (max 2400 px) pour garder l'appli fluide. */
export function readImage(file: File, max = 2400): Promise<{ src: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Image illisible"));
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const width = Math.round(img.width * k);
        const height = Math.round(img.height * k);
        if (k === 1) return resolve({ src: reader.result as string, width, height });
        const c = document.createElement("canvas");
        c.width = width;
        c.height = height;
        c.getContext("2d")!.drawImage(img, 0, 0, width, height);
        resolve({ src: c.toDataURL("image/jpeg", 0.92), width, height });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export const makeImage = (src: string, x: number, y: number, width: number, height: number, name = "Photo"): ImageShape => ({
  id: uid(),
  type: "image",
  name,
  src,
  x,
  y,
  width,
  height,
  rotation: 0,
  opacity: 1,
  visible: true,
  filters: { ...NO_FILTERS },
});

/** Ouvre le sélecteur de fichiers du système. */
export function pickFile(accept = "image/*"): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.click();
  });
}
