// Fournisseurs de paiement : E-Billing (Digitech Africa, Gabon : Airtel Money, Moov Money), Stripe (carte bancaire),
// espèces (validées à la main par l'administrateur) ; « sandbox » simule tout en recette (PAYMENTS_MODE=sandbox).
// Clés et activation : back-office (réglages des paiements), secrets chiffrés en base.
import { reglages } from "../services/reglages-paiement";

export type Checkout = { redirectUrl: string; providerRef: string | null };
export type ProviderStatus = "reussi" | "echoue" | "en_attente";
export type CheckoutParams = { reference: string; amount: number; currency: string; method: string; description: string; customer: { name: string; email?: string | null; phone?: string | null }; returnUrl: string; notifyUrl: string };
export interface PaymentProvider {
  id: string;
  createCheckout(p: CheckoutParams): Promise<Checkout>;
  check(reference: string, providerRef: string | null): Promise<ProviderStatus>;
}

/** Moyens proposés aux payeurs. */
export type MoyenPaiement = { id: string; label: string; detail?: string; pays?: string[] };
export const MOYENS: MoyenPaiement[] = [
  { id: "airtel_money", label: "Airtel Money", detail: "Demande de paiement sur ton téléphone", pays: ["GA"] },
  { id: "moov_money", label: "Moov Money", detail: "Demande de paiement sur ton téléphone", pays: ["GA"] },
  { id: "carte", label: "Carte bancaire", detail: "Visa, Mastercard · page sécurisée Stripe" },
  { id: "especes", label: "Espèces", detail: "Au bureau, puis validation par l'équipe" },
];
const ANCIENS: Record<string, string> = { mobile_money_afrique: "Mobile money", virement: "Virement", orange_money: "Orange Money", inwi_money: "inwi money", agence: "Cash Plus / Wafacash", wave: "Wave" };
export const libelleMoyen = (id: string) => MOYENS.find((m) => m.id === id)?.label ?? ANCIENS[id] ?? id;
/** Compatibilité : liste des moyens par pays de destination. */
export const METHODS: Record<string, MoyenPaiement[]> = { MA: MOYENS };
export const CURRENCY: Record<string, string> = { MA: "MAD" };
const recette = () => process.env.PAYMENTS_MODE === "sandbox";
const ZERO_DECIMALE = new Set(["XAF", "XOF", "GNF", "RWF", "UGX", "KMF", "MGA", "BIF", "DJF", "JPY", "KRW", "VND", "CLP", "PYG", "VUV", "XPF"]);

/** Moyens réellement disponibles pour une devise : selon les passerelles activées (mobile money : F CFA d'Afrique centrale). */
export async function moyensDisponibles(devise: string): Promise<MoyenPaiement[]> {
  if (recette()) return MOYENS;
  const r = await reglages();
  return MOYENS.filter((m) => (m.id === "carte" ? r.stripe.actif : m.id === "especes" ? r.especes.actif : r.ebilling.actif && devise === "XAF"));
}

export const sandbox: PaymentProvider = {
  id: "sandbox",
  async createCheckout(p) { return { redirectUrl: `/paiement/${p.reference}`, providerRef: `SBX-${p.reference}` }; },
  async check() { return "en_attente"; }, // confirmé depuis la page de paiement simulée (recette) ou par l'administrateur
};

export const especes: PaymentProvider = {
  id: "especes",
  async createCheckout(p) { return { redirectUrl: `/paiement/${p.reference}`, providerRef: null }; },
  async check() { return "en_attente"; }, // l'administrateur confirme la réception dans le back-office
};

/** Numéro gabonais au format attendu par E-Billing (0XXXXXXXX). */
export function msisdnGabon(tel: string | null | undefined) {
  let d = (tel ?? "").replace(/\D/g, "");
  if (d.startsWith("00241")) d = d.slice(5); else if (d.startsWith("241")) d = d.slice(3);
  if (d.length === 8) d = `0${d}`;
  return /^0[67]\d{7}$/.test(d) ? d : null;
}

export const ebilling: PaymentProvider = {
  id: "ebilling",
  async createCheckout(p) {
    const r = (await reglages()).ebilling;
    if (!r.username || !r.sharedKey) throw new Error("E-Billing non configuré.");
    const msisdn = msisdnGabon(p.customer.phone);
    if (!msisdn) throw new Error("Numéro Airtel Money ou Moov Money invalide.");
    const base = r.apiUrl.replace(/\/$/, "");
    const headers = { "Content-Type": "application/json", Accept: "application/json", Authorization: `Basic ${Buffer.from(`${r.username}:${r.sharedKey}`).toString("base64")}` };
    const res = await fetch(`${base}/merchant/e_bills.json`, { method: "POST", headers, signal: AbortSignal.timeout(20000),
      body: JSON.stringify({ payer_msisdn: msisdn, payer_email: p.customer.email ?? undefined, payer_name: p.customer.name.slice(0, 60), amount: p.amount, short_description: p.description.slice(0, 120), external_reference: p.reference, expiry_period: "60" }) });
    const j = (await res.json().catch(() => ({}))) as { e_bill?: { bill_id: string } };
    if (!res.ok || !j.e_bill?.bill_id) throw new Error(`E-Billing : facture refusée (${res.status}).`);
    await pousserUssd(j.e_bill.bill_id, msisdn, p.method);
    return { redirectUrl: `/paiement/${p.reference}`, providerRef: j.e_bill.bill_id };
  },
  async check(_reference, billId) {
    if (!billId) return "en_attente";
    const r = (await reglages()).ebilling;
    const res = await fetch(`${r.apiUrl.replace(/\/$/, "")}/merchant/e_bills/${encodeURIComponent(billId)}.json`, { headers: { Accept: "application/json", Authorization: `Basic ${Buffer.from(`${r.username}:${r.sharedKey}`).toString("base64")}` }, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return "en_attente";
    const j = (await res.json()) as { state?: string; e_bill?: { state?: string } };
    const s = (j.state ?? j.e_bill?.state ?? "").toLowerCase();
    return ["paid", "processed"].includes(s) ? "reussi" : ["expired", "cancelled", "canceled", "failed"].includes(s) ? "echoue" : "en_attente";
  },
};

/** (Re)demande de paiement sur le téléphone du payeur (code secret Airtel Money ou Moov Money). */
export async function pousserUssd(billId: string, msisdn: string, method: string) {
  const r = (await reglages()).ebilling;
  const res = await fetch(`${r.apiUrl.replace(/\/$/, "")}/merchant/e_bills/${encodeURIComponent(billId)}/ussd_push`, {
    method: "POST", signal: AbortSignal.timeout(20000),
    headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Basic ${Buffer.from(`${r.username}:${r.sharedKey}`).toString("base64")}` },
    body: JSON.stringify({ payer_msisdn: msisdn, payment_system_name: method === "moov_money" ? "moovmoney4" : "airtelmoney" }),
  });
  if (!res.ok) throw new Error(`E-Billing : demande sur le téléphone refusée (${res.status}).`);
}

export const stripe: PaymentProvider = {
  id: "stripe",
  async createCheckout(p) {
    const r = (await reglages()).stripe;
    if (!r.secretKey) throw new Error("Stripe non configuré.");
    const f = new URLSearchParams({
      mode: "payment", client_reference_id: p.reference, "metadata[reference]": p.reference,
      success_url: `${p.returnUrl}?retour=stripe`, cancel_url: `${p.returnUrl}?retour=annule`,
      "line_items[0][quantity]": "1", "line_items[0][price_data][currency]": p.currency.toLowerCase(),
      "line_items[0][price_data][unit_amount]": String(ZERO_DECIMALE.has(p.currency) ? Math.round(p.amount) : Math.round(p.amount * 100)),
      "line_items[0][price_data][product_data][name]": p.description.slice(0, 120), locale: "fr",
      "payment_intent_data[description]": `${p.reference} · ${p.description}`.slice(0, 200),
    });
    if (p.customer.email) f.set("customer_email", p.customer.email);
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", { method: "POST", headers: { Authorization: `Bearer ${r.secretKey}`, "Content-Type": "application/x-www-form-urlencoded", "Idempotency-Key": `navigoal-${p.reference}` }, body: f, signal: AbortSignal.timeout(20000) });
    const j = (await res.json().catch(() => ({}))) as { id?: string; url?: string; error?: { message?: string } };
    if (!res.ok || !j.url || !j.id) throw new Error(`Stripe : ${j.error?.message ?? res.status}`);
    return { redirectUrl: j.url, providerRef: j.id };
  },
  async check(_reference, sessionId) {
    if (!sessionId) return "en_attente";
    const r = (await reglages()).stripe;
    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, { headers: { Authorization: `Bearer ${r.secretKey}` }, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return "en_attente";
    const j = (await res.json()) as { payment_status?: string; status?: string };
    return j.payment_status === "paid" ? "reussi" : j.status === "expired" ? "echoue" : "en_attente";
  },
};

/** Fournisseur selon le moyen choisi (tout est simulé en recette). */
export function providerFor(method: string): PaymentProvider {
  if (recette()) return sandbox;
  if (method === "carte") return stripe;
  if (method === "airtel_money" || method === "moov_money") return ebilling;
  return especes;
}
export const providerById = (id: string) => ({ ebilling, stripe, especes, sandbox } as Record<string, PaymentProvider>)[id] ?? sandbox;
