"use client";
import { useEffect, useRef, useState } from "react";
import { useCart } from "./cart";
import { formatPrice, settings, whatsappLink, primaryPhone } from "@/lib/content";
import { IconClose, IconPhone } from "./Icons";

/** Récapitulatif + envoi de la commande par WhatsApp (aucun paiement en ligne, aucune donnée stockée). */
export function CartDrawer() {
  const { lines, total, setQty, clear, open, setOpen } = useCart();
  const ref = useRef<HTMLDialogElement>(null);
  const modes = settings.ordering.modes;
  const [mode, setMode] = useState(modes[0]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const delivery = mode === "Livraison";
  const canSend = lines.length > 0 && name.trim().length > 1 && (!delivery || address.trim().length > 3);

  const message = [
    `Bonjour Jackboy, je souhaite commander :`,
    ...lines.map((l) => `• ${l.qty} × ${l.name}${l.variant ? ` (${l.variant})` : ""} — ${formatPrice(l.price * l.qty)}`),
    `Total : ${formatPrice(total)}`,
    `Mode : ${mode}`,
    delivery ? `Adresse : ${address}` : "",
    `Nom : ${name}`,
    note ? `Remarque : ${note}` : "",
  ].filter(Boolean).join("\n");

  return (
    <dialog
      ref={ref}
      onClose={() => setOpen(false)}
      onClick={(e) => e.target === ref.current && setOpen(false)}
      aria-labelledby="cart-title"
      className="m-0 mt-auto h-[92svh] max-h-none w-full max-w-none rounded-t-3xl border border-white/10 bg-surface p-0 text-text backdrop:bg-black/75 md:m-auto md:h-auto md:max-h-[90vh] md:w-[520px] md:rounded-3xl"
    >
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-white/5 px-5 py-4">
          <h2 id="cart-title" className="font-display text-2xl">Ma commande</h2>
          <button onClick={() => setOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/5" aria-label="Fermer">
            <IconClose />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {sent ? (
            <div className="py-10 text-center">
              <p className="font-display text-3xl text-accent">Merci !</p>
              <p className="mt-3 text-sm text-muted">Votre commande a été préparée dans WhatsApp. Envoyez le message : Jackboy vous confirme le délai et le montant final.</p>
              <button onClick={() => { clear(); setSent(false); setOpen(false); }} className="mt-6 min-h-11 rounded-full border border-white/15 px-5 text-sm">Vider le panier et fermer</button>
            </div>
          ) : lines.length === 0 ? (
            <p className="py-10 text-center text-muted">Votre panier est vide. Ajoutez des produits depuis le menu.</p>
          ) : (
            <>
              <ul className="divide-y divide-white/5">
                {lines.map((l) => (
                  <li key={l.id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{l.name}</p>
                      <p className="text-xs text-muted">{l.variant ? `${l.variant} · ` : ""}{formatPrice(l.price)}</p>
                    </div>
                    <div className="flex items-center rounded-full border border-white/10">
                      <button onClick={() => setQty(l.id, l.qty - 1)} className="h-10 w-10 text-lg" aria-label={`Retirer un ${l.name}`}>−</button>
                      <span className="w-6 text-center text-sm" aria-live="polite">{l.qty}</span>
                      <button onClick={() => setQty(l.id, l.qty + 1)} className="h-10 w-10 text-lg" aria-label={`Ajouter un ${l.name}`}>+</button>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-3 flex justify-between border-t border-white/10 pt-3 text-lg font-bold">
                <span>Total</span><span className="text-accent">{formatPrice(total)}</span>
              </p>

              <fieldset className="mt-6">
                <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">Mode</legend>
                <div className="grid grid-cols-3 gap-2">
                  {modes.map((m) => (
                    <label key={m} className={`flex min-h-11 cursor-pointer items-center justify-center rounded-xl border px-2 text-center text-xs font-semibold ${mode === m ? "border-accent bg-secondary text-accent" : "border-white/10"}`}>
                      <input type="radio" name="mode" value={m} checked={mode === m} onChange={() => setMode(m)} className="sr-only" />
                      {m}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="mt-4 space-y-3">
                <label className="block text-sm">
                  <span className="mb-1 block text-muted">Votre nom *</span>
                  <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="min-h-11 w-full rounded-xl border border-white/10 bg-bg px-3" />
                </label>
                {delivery && (
                  <label className="block text-sm">
                    <span className="mb-1 block text-muted">Adresse de livraison / repère *</span>
                    <input value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" className="min-h-11 w-full rounded-xl border border-white/10 bg-bg px-3" />
                  </label>
                )}
                <label className="block text-sm">
                  <span className="mb-1 block text-muted">Remarque (cuisson, saveur chicha, wings caramélisées ou salées…)</span>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="w-full rounded-xl border border-white/10 bg-bg px-3 py-2" />
                </label>
              </div>
              <p className="mt-4 text-xs text-muted">{settings.ordering.note} La vente d&apos;alcool est réservée aux personnes majeures.</p>
            </>
          )}
        </div>

        {!sent && lines.length > 0 && (
          <footer className="space-y-2 border-t border-white/5 px-5 py-4" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
            <a
              href={canSend ? whatsappLink(message) : undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!canSend}
              onClick={(e) => { if (!canSend) e.preventDefault(); else setSent(true); }}
              className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-bold uppercase tracking-wider ${canSend ? "bg-[#25D366] text-black" : "cursor-not-allowed bg-white/10 text-muted"}`}
            >
              Envoyer la commande sur WhatsApp
            </a>
            {!canSend && <p className="text-center text-xs text-muted">Indiquez votre nom{delivery ? " et votre adresse" : ""} pour continuer.</p>}
            <a href={`tel:${primaryPhone.number}`} className="flex min-h-11 items-center justify-center gap-2 text-sm text-muted hover:text-accent">
              <IconPhone className="h-4 w-4" /> ou commander par téléphone : {primaryPhone.display}
            </a>
          </footer>
        )}
      </div>
    </dialog>
  );
}
