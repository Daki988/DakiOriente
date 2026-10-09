// Fournisseurs de paiement. « sandbox » simule un agrégateur (mobile money / carte) pour les tests et la recette.
// CinetPay : activé dès que CINETPAY_API_KEY et CINETPAY_SITE_ID sont définis (Sénégal, zone CFA).
export type Checkout = { redirectUrl: string; providerRef: string };
export type ProviderStatus = "reussi" | "echoue" | "en_attente";
export interface PaymentProvider {
  id: string;
  createCheckout(p: { reference: string; amount: number; currency: string; method: string; description: string; customer: { name: string; email?: string | null; phone?: string | null }; returnUrl: string; notifyUrl: string }): Promise<Checkout>;
  check(reference: string, providerRef: string | null): Promise<ProviderStatus>;
}

export const sandbox: PaymentProvider = {
  id: "sandbox",
  async createCheckout(p) {
    return { redirectUrl: `/paiement/${p.reference}`, providerRef: `SBX-${p.reference}` };
  },
  async check() {
    return "en_attente"; // confirmé explicitement depuis la page de paiement simulée
  },
};

export const cinetpay: PaymentProvider = {
  id: "cinetpay",
  async createCheckout(p) {
    const r = await fetch("https://api-checkout.cinetpay.com/v2/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apikey: process.env.CINETPAY_API_KEY, site_id: process.env.CINETPAY_SITE_ID, transaction_id: p.reference,
        amount: p.amount, currency: p.currency, description: p.description.slice(0, 120), notify_url: p.notifyUrl, return_url: p.returnUrl,
        channels: p.method === "carte" ? "CREDIT_CARD" : "MOBILE_MONEY", customer_name: p.customer.name, customer_email: p.customer.email ?? undefined, customer_phone_number: p.customer.phone ?? undefined,
      }),
    });
    const j = (await r.json()) as { code?: string; data?: { payment_url: string; payment_token: string }; message?: string };
    if (j.code !== "201" || !j.data) throw new Error(`CinetPay : ${j.message ?? r.status}`);
    return { redirectUrl: j.data.payment_url, providerRef: j.data.payment_token };
  },
  async check(reference) {
    const r = await fetch("https://api-checkout.cinetpay.com/v2/payment/check", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apikey: process.env.CINETPAY_API_KEY, site_id: process.env.CINETPAY_SITE_ID, transaction_id: reference }),
    });
    const j = (await r.json()) as { data?: { status: string } };
    const s = j.data?.status;
    return s === "ACCEPTED" ? "reussi" : s === "REFUSED" || s === "CANCELED" ? "echoue" : "en_attente";
  },
};

/** Choix du fournisseur : CinetPay pour les devises CFA si configuré, sinon bac à sable. */
export function providerFor(currency: string): PaymentProvider {
  if (process.env.PAYMENTS_MODE !== "sandbox" && process.env.CINETPAY_API_KEY && ["XOF", "XAF"].includes(currency)) return cinetpay;
  return sandbox;
}
export const providerById = (id: string) => (id === "cinetpay" ? cinetpay : sandbox);

export const METHODS: Record<string, { id: string; label: string }[]> = {
  GA: [{ id: "airtel_money", label: "Airtel Money" }, { id: "moov_money", label: "Moov Money" }, { id: "carte", label: "Carte bancaire" }, { id: "virement", label: "Virement international" }],
  // Destination Maroc : paiements en dirhams, depuis le Maroc ou l'étranger (parents en Afrique subsaharienne, Europe…)
  MA: [{ id: "carte", label: "Carte bancaire (Visa, Mastercard, CMI)" }, { id: "mobile_money_afrique", label: "Mobile money Afrique (Wave, Orange Money, MTN, Airtel…)" }, { id: "virement", label: "Virement international" }, { id: "orange_money", label: "Orange Money Maroc" }, { id: "inwi_money", label: "inwi money" }, { id: "agence", label: "Cash Plus / Wafacash (Maroc)" }],
  SN: [{ id: "wave", label: "Wave" }, { id: "orange_money", label: "Orange Money" }, { id: "free_money", label: "Free Money" }, { id: "carte", label: "Carte bancaire" }, { id: "virement", label: "Virement international" }],
};
export const CURRENCY: Record<string, string> = { GA: "XAF", MA: "MAD", SN: "XOF" };
