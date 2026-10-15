"use client";
import { AtSign, Phone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { paysNavigateur } from "@/lib/devises";
import { paysOrigine, paysOrigineById } from "@/lib/pays-origine";

/** Indicatifs téléphoniques (référentiel des pays d'origine), triés par nom de pays. */
const INDICATIFS = paysOrigine.filter((p) => p.indicatif).map((p) => ({ id: p.id, nom: p.nom, indicatif: p.indicatif.startsWith("+") ? p.indicatif : `+${p.indicatif}` }))
  .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
const flag = (iso: string) => iso.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
const indicatifOf = (pays?: string | null) => {
  const i = pays ? paysOrigineById[pays]?.indicatif : null;
  return i ? (i.startsWith("+") ? i : `+${i}`) : "+212";
};
/** Pays par défaut : pays choisi, sinon langue du navigateur, sinon le Maroc. */
export const defaultCountry = () => paysNavigateur() ?? "MA";

/** Compose le numéro international : indicatif + numéro national (zéro initial retiré). */
export function composePhone(pays: string, local: string) {
  const raw = local.replace(/[^\d+]/g, "");
  if (raw.startsWith("+")) return raw;
  if (raw.startsWith("00")) return `+${raw.slice(2)}`;
  return `${indicatifOf(pays)}${raw.replace(/^0+/, "")}`;
}

function CountryCode({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <label className="relative flex shrink-0 items-center">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input h-full w-[104px] appearance-none pr-6 text-[15px] sm:text-sm" aria-label={label}>
        {INDICATIFS.map((p) => <option key={p.id} value={p.id}>{flag(p.id)} {p.indicatif} · {p.nom}</option>)}
      </select>
      <span className="pointer-events-none absolute right-2.5 text-[10px] text-ink-mute">▼</span>
    </label>
  );
}

/** Téléphone avec indicatif du pays (liste des pays d'origine). */
export function PhoneInput({ id, country, onCountry, value, onChange, required, invalid }: { id: string; country: string; onCountry: (c: string) => void; value: string; onChange: (v: string) => void; required?: boolean; invalid?: boolean }) {
  return (
    <div className="flex gap-2">
      <CountryCode value={country} onChange={onCountry} label="Indicatif du pays" />
      <div className="relative min-w-0 flex-1">
        <Phone size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute" />
        <input id={id} type="tel" inputMode="tel" autoComplete="tel-national" value={value} onChange={(e) => onChange(e.target.value)} required={required} aria-invalid={invalid || undefined}
          placeholder={country === "MA" ? "6 12 34 56 78" : "Numéro sans l'indicatif"} className={`input pl-10 text-[15px] sm:text-sm ${invalid ? "border-[#d42a50]" : ""}`} />
      </div>
    </div>
  );
}

/**
 * Identifiant de connexion : e-mail ou téléphone. Dès qu'un numéro est saisi sans « + », un sélecteur d'indicatif apparaît.
 * `onValue` reçoit l'identifiant normalisé (e-mail tel quel, téléphone au format international).
 */
export function IdentifierInput({ id, initial = "", onValue, placeholder = "E-mail ou numéro de téléphone", autoFocus }: { id: string; initial?: string; onValue: (v: string) => void; placeholder?: string; autoFocus?: boolean }) {
  const [text, setText] = useState(initial);
  const [country, setCountry] = useState("MA");
  useEffect(() => { setCountry(defaultCountry()); }, []);
  const phoneLike = useMemo(() => /^[\d\s().-]{3,}$/.test(text.trim()), [text]);
  useEffect(() => { onValue(phoneLike ? composePhone(country, text) : text.trim()); }, [text, country, phoneLike, onValue]);
  return (
    <div className="flex gap-2">
      {phoneLike && <CountryCode value={country} onChange={setCountry} label="Indicatif du pays" />}
      <div className="relative min-w-0 flex-1">
        {phoneLike ? <Phone size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute" /> : <AtSign size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute" />}
        <input id={id} value={text} onChange={(e) => setText(e.target.value)} autoComplete="username" required autoFocus={autoFocus} placeholder={placeholder} inputMode={phoneLike ? "tel" : "email"}
          className="input pl-10 text-[15px] sm:text-sm" />
      </div>
    </div>
  );
}
