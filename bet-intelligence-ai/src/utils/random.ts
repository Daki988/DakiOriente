/** Générateur pseudo-aléatoire déterministe (mulberry32) : même graine ⇒ mêmes données. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash FNV-1a 32 bits d'une chaîne, utile pour dériver des graines stables. */
export function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Tirage selon une loi de Poisson (algorithme de Knuth), avec un générateur fourni. */
export function samplePoisson(lambda: number, rand: () => number): number {
  const limit = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rand();
  } while (p > limit && k < 20);
  return k - 1;
}
