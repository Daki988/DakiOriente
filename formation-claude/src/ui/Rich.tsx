import { Fragment, useState, type ReactNode } from "react";
import type { Block } from "../content/types";

/** Texte enrichi : **gras** et `code` */
export function Rich({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(<Fragment key={k++}>{text.slice(last, m.index)}</Fragment>);
    const tok = m[0];
    parts.push(tok.startsWith("**") ? <strong key={k++}>{tok.slice(2, -2)}</strong> : <code key={k++} className="ic">{tok.slice(1, -1)}</code>);
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(<Fragment key={k++}>{text.slice(last)}</Fragment>);
  return <>{parts}</>;
}

function CodeBlock({ title, text }: { title?: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* presse-papiers indisponible */
    }
  };
  return (
    <figure className="code">
      <figcaption>
        <span className="dots" aria-hidden><i /><i /><i /></span>
        <span className="code-title">{title ?? "terminal"}</span>
        <button className="copy" onClick={copy}>{copied ? "Copié ✓" : "Copier"}</button>
      </figcaption>
      <pre><code>{text}</code></pre>
    </figure>
  );
}

export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="blocks">
      {blocks.map((b, i) => {
        switch (b.t) {
          case "p":
            return <p key={i}><Rich text={b.text} /></p>;
          case "list": {
            const L = b.ordered ? "ol" : "ul";
            return <L key={i} className="blist">{b.items.map((it) => <li key={it}><Rich text={it} /></li>)}</L>;
          }
          case "table":
            return (
              <div key={i} className="table-wrap">
                <table>
                  <thead><tr>{b.head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
                  <tbody>{b.rows.map((r, j) => <tr key={j}>{r.map((c, k) => <td key={k} data-label={b.head[k]}><Rich text={c} /></td>)}</tr>)}</tbody>
                </table>
              </div>
            );
          case "code":
            return <CodeBlock key={i} title={b.title} text={b.text} />;
          case "callout":
            return (
              <aside key={i} className={`callout callout-${b.tone}`}>
                <strong>{b.tone === "warn" ? "⚠️ " : b.tone === "tip" ? "💡 " : "🔑 "}{b.title}</strong>
                <span><Rich text={b.text} /></span>
              </aside>
            );
          case "compare":
            return (
              <div key={i} className="compare">
                <div className="cmp cmp-flou"><span className="cmp-tag">✗ Flou</span><p>{b.flou}</p></div>
                <div className="cmp cmp-precis"><span className="cmp-tag">✓ Précis</span><p>{b.precis}</p></div>
              </div>
            );
        }
      })}
    </div>
  );
}
