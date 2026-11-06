import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from './Icon';
import { useOnline, usePending } from '../app/hooks';

export function SyncPill() {
  const online = useOnline();
  const pending = usePending();
  if (!online) return <span className="pill off"><span className="dot" style={{ background: 'var(--sun)' }} />Hors ligne · {pending} en attente</span>;
  if (pending > 0) return <span className="pill sky"><span className="dot" style={{ background: 'var(--sky)' }} />{pending} à envoyer</span>;
  return <span className="pill on"><span className="dot" style={{ background: 'var(--green)' }} />À jour</span>;
}

export function BackBar({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  const nav = useNavigate();
  return (
    <div className="back">
      <button className="iconbtn" aria-label="Retour" onClick={() => nav(-1)}><Icon name="back" size={24} stroke={2.2} /></button>
      <div style={{ flex: 1, minWidth: 0 }}><h2>{title}</h2>{sub && <div className="sub">{sub}</div>}</div>
      {right}
    </div>
  );
}

export function Stepper({ label, hint, value, onChange, step = 1, icon, tint, max }: {
  label: ReactNode; hint?: string; value: number; onChange: (n: number) => void; step?: number; icon?: string; tint?: [string, string]; max?: number;
}) {
  const set = (n: number) => onChange(Math.max(0, max !== undefined ? Math.min(max, n) : n));
  return (
    <div className="field">
      {icon && tint && <div className="ico" style={{ background: tint[0] }}><Icon name={icon} color={tint[1]} /></div>}
      <div className="lab"><b>{label}</b>{hint && <span>{hint}</span>}</div>
      <div className="stepper">
        <button className="btn-r" aria-label="Diminuer" onClick={() => set(value - step)}>−</button>
        <input className="num" inputMode="numeric" aria-label={typeof label === 'string' ? label : 'valeur'} value={value}
          onChange={(e) => set(Number(e.target.value.replace(/\D/g, '')) || 0)} />
        <button className="btn-r" aria-label="Augmenter" onClick={() => set(value + step)}>+</button>
      </div>
    </div>
  );
}

export function useToast(): [ReactNode, (m: string) => void] {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => { if (!msg) return; const t = setTimeout(() => setMsg(null), 2600); return () => clearTimeout(t); }, [msg]);
  return [msg ? <div className="toast" role="status">{msg}</div> : null, setMsg];
}

export function Kv({ k, v, cls }: { k: string; v: ReactNode; cls?: string }) {
  return <div className="kv"><span>{k}</span><b className={cls}>{v}</b></div>;
}
