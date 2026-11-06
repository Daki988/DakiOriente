// Évaluateur de formules sûr (sans eval) : les indicateurs ne sont jamais codés en dur (§ 7.3).
// Grammaire : nombres, variables [a-z_]+, + - * / ( ), fonctions min(a,b) max(a,b) round(a,n).

type Tok = { t: 'num'; v: number } | { t: 'id'; v: string } | { t: 'op'; v: string };

function tokenize(src: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9.]/.test(c)) {
      let j = i; while (j < src.length && /[0-9.]/.test(src[j])) j++;
      out.push({ t: 'num', v: Number(src.slice(i, j)) }); i = j; continue;
    }
    if (/[a-zA-Z_]/.test(c)) {
      let j = i; while (j < src.length && /[a-zA-Z_0-9]/.test(src[j])) j++;
      out.push({ t: 'id', v: src.slice(i, j) }); i = j; continue;
    }
    if ('+-*/(),'.includes(c)) { out.push({ t: 'op', v: c }); i++; continue; }
    throw new Error(`Caractère inattendu « ${c} »`);
  }
  return out;
}

const FUNCS: Record<string, (...a: number[]) => number> = {
  min: Math.min,
  max: Math.max,
  round: (a, n = 0) => Math.round(a * 10 ** n) / 10 ** n,
};

/** Analyse récursive descendante ; renvoie une fonction d'évaluation. */
export function compileFormula(src: string): (vars: Record<string, number>) => number {
  const toks = tokenize(src);
  let p = 0;
  const peek = () => toks[p];
  const eat = (v?: string) => {
    const t = toks[p++];
    if (!t || (v && !(t.t === 'op' && t.v === v))) throw new Error(`Formule invalide près de la position ${p}`);
    return t;
  };
  type Node = (vars: Record<string, number>) => number;
  const expr = (): Node => {
    let left = term();
    while (peek()?.t === 'op' && (peek()!.v === '+' || peek()!.v === '-')) {
      const op = eat().v; const right = term(); const l = left;
      left = op === '+' ? (x) => l(x) + right(x) : (x) => l(x) - right(x);
    }
    return left;
  };
  const term = (): Node => {
    let left = factor();
    while (peek()?.t === 'op' && (peek()!.v === '*' || peek()!.v === '/')) {
      const op = eat().v; const right = factor(); const l = left;
      left = op === '*' ? (x) => l(x) * right(x) : (x) => { const d = right(x); return d === 0 ? NaN : l(x) / d; };
    }
    return left;
  };
  const factor = (): Node => {
    const t = peek();
    if (!t) throw new Error('Formule incomplète');
    if (t.t === 'op' && t.v === '-') { eat(); const f = factor(); return (x) => -f(x); }
    if (t.t === 'op' && t.v === '(') { eat('('); const e = expr(); eat(')'); return e; }
    if (t.t === 'num') { eat(); return () => t.v; }
    if (t.t === 'id') {
      eat();
      if (peek()?.t === 'op' && peek()!.v === '(') {
        const fn = FUNCS[t.v];
        if (!fn) throw new Error(`Fonction inconnue « ${t.v} »`);
        eat('(');
        const args: Node[] = [expr()];
        while (peek()?.t === 'op' && peek()!.v === ',') { eat(','); args.push(expr()); }
        eat(')');
        return (x) => fn(...args.map((a) => a(x)));
      }
      const name = t.v;
      return (x) => {
        if (!(name in x)) throw new Error(`Variable inconnue « ${name} »`);
        return x[name];
      };
    }
    throw new Error('Formule invalide');
  };
  const root = expr();
  if (p !== toks.length) throw new Error('Formule invalide : éléments en trop');
  return root;
}

export function evalFormula(src: string, vars: Record<string, number>): number {
  return compileFormula(src)(vars);
}

/** Vérifie une formule avant enregistrement par un profil habilité. */
export function validateFormula(src: string, allowed: string[]): string | null {
  try {
    const sample = Object.fromEntries(allowed.map((k) => [k, 1]));
    compileFormula(src)(sample);
    return null;
  } catch (e) {
    return (e as Error).message;
  }
}
