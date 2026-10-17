"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { Product } from "@/lib/catalog";
import { fcfa } from "@/lib/format";
import { quote, type Selection } from "@/lib/pricing";
import { ArrowRight, Chat, Check, Pen, Upload } from "@/components/Icons";

type Settings = { whatsapp: string; designFee: number; deliveryFee: number; pickupLabel: string; deliveryLabel: string };
const EXT = ["pdf", "png", "jpg", "jpeg", "ai", "eps", "svg", "psd", "tif", "tiff", "zip"];
const MAX_MB = 100;

const wa = (phone: string, text: string) => `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
const card = "grid gap-4 rounded-2xl bg-white p-4 md:p-6";
const label = "text-[13px] font-semibold text-muted";
const input = "w-full rounded-xl border border-line bg-paper px-3.5 py-3 text-[16px] outline-none focus:border-brand";
const chip = (on: boolean) => `rounded-full px-3.5 py-2 text-sm transition ${on ? "bg-ink font-bold text-white" : "border border-line bg-paper font-medium hover:border-ink"}`;

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className={card} aria-labelledby={`step-${n}`}>
      <h2 id={`step-${n}`} className="flex items-baseline gap-3 text-xl font-bold">
        <span className="tabular font-sans text-sm font-normal text-muted">(0{n})</span>{title}
      </h2>
      {children}
    </section>
  );
}

export function OrderFlow({ product, settings, initialQty, online }: { product: Product; settings: Settings; initialQty?: number; online: boolean }) {
  const p = product;
  const firstQty = p.pricing === "pack" ? (p.tiers.find((t) => t.qty === initialQty)?.qty ?? p.tiers[Math.min(1, p.tiers.length - 1)]?.qty ?? 1) : 1;
  const [qty, setQty] = useState(firstQty);
  const [w, setW] = useState(p.formatMm ? Math.round(p.formatMm[0] / 10) : 200);
  const [h, setH] = useState(p.formatMm ? Math.round(p.formatMm[1] / 10) : 100);
  const [choices, setChoices] = useState<Record<string, string>>(() => Object.fromEntries(p.options.map((o) => [o.name, o.choices[0].label])));
  const [mode, setMode] = useState<"file" | "design">("file");
  const [file, setFile] = useState<File | null>(null);
  const [fileMsg, setFileMsg] = useState<{ tone: "ok" | "warn" | "err"; text: string } | null>(null);
  const [brief, setBrief] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [delivery, setDelivery] = useState<"pickup" | "libreville">("pickup");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ code: string; token: string; total: number; uploadFailed?: boolean } | null>(null);
  const [fallback, setFallback] = useState(false);

  const sel: Selection = { qty, choices, design: mode === "design", ...(p.pricing === "area" ? { widthCm: w, heightCm: h } : {}) };
  const q = useMemo(() => quote(p, sel, settings.designFee), [p, qty, w, h, choices, mode, settings.designFee]); // eslint-disable-line react-hooks/exhaustive-deps
  const deliveryFee = delivery === "libreville" ? settings.deliveryFee : 0;
  const total = q.ok ? q.total + deliveryFee : 0;

  const summary = () => {
    const parts = [p.pricing === "area" ? `${w}×${h} cm × ${qty}` : `${qty} ${p.unit}`, ...Object.values(choices)];
    return `${p.name} (${parts.join(", ")})`;
  };

  /** Vérifie format, poids et, pour une image, la netteté à la taille d'impression. */
  function pickFile(f: File | null) {
    setFile(null); setFileMsg(null);
    if (!f) return;
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    if (!EXT.includes(ext)) return setFileMsg({ tone: "err", text: `Format non accepté. Formats possibles : ${EXT.join(", ")}.` });
    if (f.size > MAX_MB * 1024 * 1024) return setFileMsg({ tone: "err", text: `Fichier trop lourd (${MAX_MB} Mo maximum). Envoyez-le sur WhatsApp ou compressez-le.` });
    setFile(f);
    if (!f.type.startsWith("image/") || f.type === "image/svg+xml") {
      return setFileMsg({ tone: "ok", text: "Fichier reçu. Nous le vérifions avant impression." });
    }
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      const widthMm = p.pricing === "area" ? w * 10 : (p.formatMm?.[0] ?? 100);
      const longPx = Math.max(img.naturalWidth, img.naturalHeight);
      const longMm = p.pricing === "area" ? Math.max(w, h) * 10 : Math.max(...(p.formatMm ?? [widthMm]));
      const dpi = Math.round(longPx / (longMm / 25.4));
      const need = longMm >= 500 ? 100 : 250;
      setFileMsg(dpi >= need
        ? { tone: "ok", text: `Image nette : environ ${dpi} dpi à la taille d’impression.` }
        : { tone: "warn", text: `Image un peu petite : environ ${dpi} dpi à la taille d’impression (${need} recommandés). Le résultat risque d’être flou. Envoyez une version plus grande si vous l’avez.` });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!q.ok) return setError(q.error);
    if (mode === "file" && !file) return setError("Ajoutez votre fichier, ou choisissez la création par un graphiste.");
    const honeypot = (e.currentTarget.elements.namedItem("website") as HTMLInputElement | null)?.value;
    setBusy("Enregistrement de la commande…");
    try {
      const res = await fetch("/api/commandes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: p.slug, selection: sel, website: honeypot,
          customer: { name, phone, email }, delivery: { mode: delivery, address },
          notes: mode === "design" ? `Brief graphiste : ${brief}` : undefined,
          file: mode === "file" && file ? { name: file.name, size: file.size } : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 503 && data.fallback === "whatsapp") { setFallback(true); return; }
      if (!res.ok) { setError(data.error ?? "La commande n’a pas pu être envoyée. Réessayez."); return; }

      let uploadFailed = false;
      if (data.upload && file) {
        setBusy("Envoi du fichier… (gardez la page ouverte)");
        const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
        const up = await sb.storage.from("print-files").uploadToSignedUrl(data.upload.path, data.upload.token, file, { contentType: file.type || "application/octet-stream" });
        uploadFailed = Boolean(up.error);
      }
      setDone({ code: data.code, token: data.token, total: data.total, uploadFailed });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Connexion perdue. Vérifiez votre réseau et réessayez.");
    } finally {
      setBusy(null);
    }
  }

  if (done) {
    const track = `${window.location.origin}/suivi/${done.token}`;
    const msg = `Bonjour Neam Print, je viens de passer la commande ${done.code} : ${summary()}. Total ${fcfa(done.total)}. Nom : ${name}. Suivi : ${track}`;
    return (
      <div className={`${card} border-ok`} role="status">
        <span className="grid size-12 place-items-center rounded-full bg-ok text-white"><Check className="size-6" /></span>
        <h2 className="text-3xl font-extrabold">Commande {done.code} enregistrée</h2>
        <p className="text-muted">Total : <b className="tabular text-ink">{fcfa(done.total)}</b>. Nous vérifions votre {mode === "design" ? "demande" : "fichier"} et vous confirmons le paiement et le délai sur WhatsApp.</p>
        {done.uploadFailed && (
          <p className="rounded-xl bg-warn-soft p-3 text-sm text-warn">Votre fichier n’a pas pu être envoyé. Envoyez-le-nous sur WhatsApp en rappelant le numéro {done.code}.</p>
        )}
        <a href={wa(settings.whatsapp, msg)} target="_blank" rel="noopener" className="flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-4 font-bold text-white">
          <Chat /> Prévenir Neam Print sur WhatsApp
        </a>
        <Link href={`/suivi/${done.token}`} className="flex items-center justify-center gap-2 rounded-full border border-line px-6 py-4 font-bold">
          Suivre ma commande <ArrowRight />
        </Link>
        <p className="text-xs text-muted">Gardez le lien de suivi : il permet de voir l’avancement sans compte.</p>
      </div>
    );
  }

  if (fallback) {
    const msg = `Bonjour Neam Print, je souhaite commander : ${summary()}. Total affiché : ${fcfa(total)}. ${mode === "design" ? `Besoin d’un graphiste : ${brief}` : "J’ai mon fichier."} Livraison : ${delivery === "libreville" ? address : "retrait"}. Nom : ${name}.`;
    return (
      <div className={card} role="status">
        <h2 className="text-2xl font-extrabold">Finalisez sur WhatsApp</h2>
        <p className="text-muted">La commande en ligne n’est pas encore active. Votre demande est prête : envoyez-la, puis joignez votre fichier dans la conversation.</p>
        <a href={wa(settings.whatsapp, msg)} target="_blank" rel="noopener" className="flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-4 font-bold text-white"><Chat /> Envoyer sur WhatsApp</a>
        <button type="button" onClick={() => setFallback(false)} className="text-sm font-semibold text-muted underline">Modifier ma commande</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-4" noValidate>
      <Step n={1} title="Combien, et comment ?">
        {p.pricing === "pack" && (
          <fieldset className="grid gap-2">
            <legend className={`${label} mb-2`}>Quantité</legend>
            <div className="flex flex-wrap gap-2">
              {p.tiers.map((t) => (
                <button key={t.qty} type="button" aria-pressed={qty === t.qty} className={`tabular ${chip(qty === t.qty)}`} onClick={() => setQty(t.qty)}>
                  {t.qty.toLocaleString("fr-FR")} <span className="opacity-70">· {fcfa(t.price)}</span>
                </button>
              ))}
            </div>
          </fieldset>
        )}
        {p.pricing === "unit" && (
          <label className="grid gap-1.5 sm:max-w-48">
            <span className={label}>Quantité ({p.unit})</span>
            <input className={`${input} tabular`} type="number" inputMode="numeric" min={1} max={10000} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} />
          </label>
        )}
        {p.pricing === "area" && (
          <div className="grid grid-cols-3 gap-2">
            <label className="grid gap-1.5"><span className={label}>Largeur (cm)</span><input className={`${input} tabular`} type="number" inputMode="numeric" min={5} max={5000} value={w} onChange={(e) => setW(Number(e.target.value))} /></label>
            <label className="grid gap-1.5"><span className={label}>Hauteur (cm)</span><input className={`${input} tabular`} type="number" inputMode="numeric" min={5} max={5000} value={h} onChange={(e) => setH(Number(e.target.value))} /></label>
            <label className="grid gap-1.5"><span className={label}>Exemplaires</span><input className={`${input} tabular`} type="number" inputMode="numeric" min={1} max={500} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} /></label>
            {q.ok && q.area !== undefined && <p className="col-span-3 text-sm text-muted">Surface facturée : <b className="tabular text-ink">{q.area.toLocaleString("fr-FR")} m²</b> (1 m² minimum)</p>}
          </div>
        )}
        {p.options.map((o) => (
          <fieldset key={o.name} className="grid gap-2">
            <legend className={`${label} mb-2`}>{o.name}</legend>
            <div className="flex flex-wrap gap-2">
              {o.choices.map((c) => (
                <button key={c.label} type="button" aria-pressed={choices[o.name] === c.label} className={chip(choices[o.name] === c.label)} onClick={() => setChoices({ ...choices, [o.name]: c.label })}>
                  {c.label}{c.pct ? <span className="opacity-70"> · {c.pct > 0 ? "+" : ""}{c.pct} %</span> : null}
                </button>
              ))}
            </div>
          </fieldset>
        ))}
      </Step>

      <Step n={2} title="Vous avez déjà votre fichier ?">
        <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Design">
          {([["file", "J’ai mon fichier", "PDF, image, AI… jusqu’à 100 Mo", Upload], ["design", "Un graphiste le crée", `+ ${fcfa(settings.designFee)}`, Pen]] as const).map(([v, t, d, Icon]) => (
            <button key={v} type="button" role="radio" aria-checked={mode === v} onClick={() => setMode(v)}
              className={`flex items-center gap-3 rounded-2xl border-2 p-3.5 text-left ${mode === v ? "border-brand bg-brand-soft" : "border-line bg-paper"}`}>
              <Icon className="size-6 flex-none text-brand" />
              <span className="grid"><b>{t}</b><span className="text-sm text-muted">{d}</span></span>
            </button>
          ))}
        </div>
        {mode === "file" ? (
          <div className="grid gap-2">
            <label className="flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-line bg-paper px-4 py-6 text-center hover:border-brand">
              <Upload className="size-7 text-brand" />
              <span className="font-bold">{file ? file.name : "Choisir mon fichier"}</span>
              <span className="text-sm text-muted">{file ? `${(file.size / 1024 / 1024).toFixed(1)} Mo` : "Fond perdu 3 mm, couleurs CMJN, 300 dpi idéalement"}</span>
              <input type="file" className="sr-only" accept={EXT.map((x) => "." + x).join(",")} onChange={(e) => pickFile(e.target.files?.[0] ?? null)} />
            </label>
            {fileMsg && (
              <p role="status" className={`rounded-xl p-3 text-sm ${fileMsg.tone === "ok" ? "bg-ok-soft text-ok" : fileMsg.tone === "warn" ? "bg-warn-soft text-warn" : "bg-danger-soft text-danger"}`}>{fileMsg.text}</p>
            )}
          </div>
        ) : (
          <label className="grid gap-1.5">
            <span className={label}>Ce que vous voulez (textes, couleurs, logo, idées)</span>
            <textarea className={`${input} min-h-28`} value={brief} onChange={(e) => setBrief(e.target.value)} maxLength={800}
              placeholder="Ex. : carte noire et dorée, nom Aïcha Nzé, directrice commerciale, 077 00 00 00. J’enverrai mon logo sur WhatsApp." />
          </label>
        )}
      </Step>

      <Step n={3} title="Où vous joindre ?">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5"><span className={label}>Nom et prénom</span><input className={input} autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label className="grid gap-1.5"><span className={label}>Numéro WhatsApp</span><input className={`${input} tabular`} type="tel" autoComplete="tel" inputMode="tel" placeholder="077 00 00 00" required value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
          <label className="grid gap-1.5 sm:col-span-2"><span className={label}>E-mail (facultatif)</span><input className={input} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        </div>
        <fieldset className="grid gap-2">
          <legend className={`${label} mb-2`}>Récupération</legend>
          <div className="flex flex-wrap gap-2">
            <button type="button" aria-pressed={delivery === "pickup"} className={chip(delivery === "pickup")} onClick={() => setDelivery("pickup")}>{settings.pickupLabel}</button>
            <button type="button" aria-pressed={delivery === "libreville"} className={chip(delivery === "libreville")} onClick={() => setDelivery("libreville")}>{settings.deliveryLabel} · {fcfa(settings.deliveryFee)}</button>
          </div>
        </fieldset>
        {delivery === "libreville" && (
          <label className="grid gap-1.5"><span className={label}>Adresse de livraison (quartier, repère)</span><input className={input} autoComplete="street-address" value={address} onChange={(e) => setAddress(e.target.value)} /></label>
        )}
        <div className="hidden" aria-hidden="true"><label>Site web<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      </Step>

      <section className={`${card} md:sticky md:bottom-4`} aria-live="polite">
        {q.ok ? (
          <dl className="tabular grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted">{p.name}</dt><dd className="text-right font-semibold">{fcfa(q.base)}</dd>
            {q.optionsDelta !== 0 && <><dt className="text-muted">Options</dt><dd className="text-right font-semibold">{q.optionsDelta > 0 ? "+" : "−"} {fcfa(Math.abs(q.optionsDelta))}</dd></>}
            {q.design > 0 && <><dt className="text-muted">Création graphiste</dt><dd className="text-right font-semibold">+ {fcfa(q.design)}</dd></>}
            {deliveryFee > 0 && <><dt className="text-muted">Livraison</dt><dd className="text-right font-semibold">+ {fcfa(deliveryFee)}</dd></>}
            <dt className="mt-2 border-t border-line pt-2 font-semibold">Total</dt>
            <dd className="mt-2 border-t border-line pt-2 text-right font-display text-3xl font-extrabold tracking-tight">{fcfa(total)}</dd>
          </dl>
        ) : (
          <p className="rounded-xl bg-warn-soft p-3 text-sm text-warn">{q.error}</p>
        )}
        {error && <p role="alert" className="rounded-xl bg-danger-soft p-3 text-sm text-danger">{error}</p>}
        <button type="submit" disabled={!q.ok || Boolean(busy)} className="flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-4 font-bold text-white disabled:opacity-60">
          {busy ?? (online ? "Commander" : "Préparer ma commande")} {!busy && <ArrowRight />}
        </button>
        <p className="text-xs text-muted">Aucun paiement maintenant. Nous vérifions votre commande, puis vous payez par Airtel Money, Moov Money ou en espèces.</p>
      </section>
    </form>
  );
}
