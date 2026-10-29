// Tests de sécurité du serveur NEAM (Supabase local) : chaque test joue un utilisateur
// malveillant qui tente de dépasser ses droits. ✓ = protégé, ✗ = faille.
// Prérequis : `npx supabase start` puis `npx supabase db reset`.
// Lancer : node scripts/test-security.mjs
import { createClient } from '@supabase/supabase-js'
import { execSync } from 'node:child_process'

const URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321'
const KEY = process.env.SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const DB = process.env.DB_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'

let failures = 0
const ok = (cond, label) => {
  console.log(`${cond ? '✓' : '✗'} ${label}`)
  if (!cond) failures++
}
const sql = (q) => execSync(`psql "${DB}" -tAc "${q.replace(/"/g, '\\"')}"`).toString().trim()
const anon = createClient(URL, KEY, { auth: { persistSession: false } })

async function login(phone) {
  const c = createClient(URL, KEY, { auth: { persistSession: false } })
  const { error: e1 } = await c.auth.signInWithOtp({ phone })
  if (e1) throw new Error(`OTP ${phone}: ${e1.message}`)
  const { data, error } = await c.auth.verifyOtp({ phone, token: '123456', type: 'sms' })
  if (error) throw new Error(`verify ${phone}: ${error.message}`)
  return { c, id: data.user.id }
}

const admin = await login('24107000001')
const victim = await login('24107000002')
const merchant = await login('24107000003')
const courier = await login('24107000004')
const attacker = await login('24107000005')
sql(`update public.profiles set role = 'admin' where id = '${admin.id}'`)

// Mise en place : un marchand, un livreur, une commande du client victime
const ma = await merchant.c.rpc('submit_application', { p_kind: 'merchant', p_full_name: 'Awa', p_phone: '+24107000003', p_details: { store_name: 'Épicerie Awa' } })
const ca = await courier.c.rpc('submit_application', { p_kind: 'courier', p_full_name: 'Junior', p_phone: '+24107000004', p_details: { vehicle: 'Moto' } })
await admin.c.rpc('admin_review_application', { p_application: ma.data.id, p_approve: true })
await admin.c.rpc('admin_review_application', { p_application: ca.data.id, p_approve: true })
const { data: store } = await merchant.c.from('stores').select('*').eq('owner_id', merchant.id).single()
const { data: prod } = await merchant.c.from('products').insert({ store_id: store.id, name: 'Riz', category: 'Produits alimentaires', unit: '5 kg', emoji: '🍚', price: 4500 }).select().single()
const { data: order } = await victim.c.rpc('place_market_order', { p_store: store.id, p_items: [{ product_id: prod.id, qty: 1 }], p_address: 'Louis', p_phone: '+24107000002', p_name: 'Grâce' })

console.log('\n— Élévation de privilèges')
await attacker.c.from('profiles').update({ role: 'admin' }).eq('id', attacker.id)
ok((await attacker.c.rpc('my_role')).data === 'client', 'un client ne peut pas se donner le rôle admin')
const fakeApp = await attacker.c.rpc('submit_application', { p_kind: 'admin', p_full_name: 'x', p_phone: 'x', p_details: {} })
ok(!!fakeApp.error, 'impossible de candidater comme admin')
ok(!!(await attacker.c.rpc('admin_users')).data?.length === false, 'un client ne voit pas la liste des comptes')
ok(!!(await attacker.c.rpc('admin_update_setting', { p_key: 'market_delivery_fee', p_value: 0 })).error, 'un client ne peut pas changer les tarifs')
ok(!!(await anon.rpc('place_market_order', { p_store: store.id, p_items: [], p_address: 'x', p_phone: 'x' })).error, 'un visiteur non connecté ne peut pas commander')

console.log('\n— Accès aux données des autres')
ok(!(await attacker.c.from('orders').select('id').eq('id', order.id)).data?.length, 'un client ne voit pas la commande d’un autre')
ok(!(await attacker.c.from('order_secrets').select('*')).data?.length, 'un client ne voit pas les codes de remise des autres')
ok(!(await courier.c.from('order_secrets').select('*')).data?.length, 'le livreur ne voit pas le code de remise')
ok(!(await merchant.c.from('order_secrets').select('*')).data?.length, 'le marchand ne voit pas le code de remise')
ok(!(await attacker.c.from('profiles').select('phone').neq('id', attacker.id)).data?.length, 'un client ne voit pas les numéros des autres')
ok(!(await anon.from('orders').select('id')).data?.length, 'un visiteur ne voit aucune commande')
ok(!(await attacker.c.rpc('courier_public', { p_order: order.id })).data?.length, 'un client ne localise pas le livreur d’un autre')
const cash = await attacker.c.rpc('courier_cash_due', { p_courier: courier.id })
ok(!!cash.error || cash.data === null, 'un client ne voit pas les espèces dues par un livreur')
const fin = await attacker.c.rpc('store_finances', { p_store: store.id })
ok(!fin.data?.length, 'un client ne voit pas les finances d’une boutique')

console.log('\n— Falsification')
ok(!(await attacker.c.from('orders').update({ status: 'delivered' }).eq('id', order.id).select()).data?.length, 'un client ne peut pas modifier une commande directement')
ok(!!(await attacker.c.rpc('cancel_my_order', { p_order: order.id })).error, 'un client ne peut pas annuler la commande d’un autre')
ok(!!(await attacker.c.rpc('merchant_update_order', { p_order: order.id, p_action: 'reject' })).error, 'un client ne peut pas refuser la commande d’une boutique')
const forged = await attacker.c.rpc('log_event', { p_order: order.id, p_status: 'cancelled', p_note: 'Payez par Mobile Money au 077 00 00 00' })
const injected = sql(`select count(*) from public.order_events where order_id = '${order.id}' and actor_id = '${attacker.id}'`)
ok(!!forged.error && injected === '0', 'un client ne peut pas écrire dans l’historique d’une commande (faux message)')
const bad = await victim.c.rpc('place_market_order', { p_store: store.id, p_items: [{ product_id: prod.id, qty: -5 }], p_address: 'x', p_phone: 'x' })
ok(!!bad.error, 'quantité négative refusée (prix recalculé côté serveur)')

console.log('\n— Code de remise (preuve de livraison)')
await courier.c.rpc('courier_set_online', { p_online: true })
await merchant.c.rpc('merchant_update_order', { p_order: order.id, p_action: 'accept' })
await merchant.c.rpc('merchant_update_order', { p_order: order.id, p_action: 'ready' })
await admin.c.rpc('admin_assign_courier', { p_order: order.id, p_courier: courier.id })
await courier.c.rpc('courier_update_order', { p_order: order.id, p_action: 'pickup' })
const real = sql(`select delivery_code from public.order_secrets where order_id = '${order.id}'`)
let found = false
for (let i = 0; i < 30 && !found; i++) {
  const guess = String(i).padStart(4, '0')
  if (guess === real) continue
  await courier.c.rpc('courier_update_order', { p_order: order.id, p_action: 'deliver', p_code: guess })
}
const afterGuesses = await courier.c.rpc('courier_update_order', { p_order: order.id, p_action: 'deliver', p_code: real })
ok(!!afterGuesses.error, 'après plusieurs codes faux, la remise est bloquée (impossible de deviner le code en essayant tout)')

console.log('\n— Abus et saturation')
let spam = 0
for (let i = 0; i < 8; i++) if (!(await attacker.c.rpc('place_market_order', { p_store: store.id, p_items: [{ product_id: prod.id, qty: 1 }], p_address: 'faux', p_phone: '+24100000000' })).error) spam++
ok(spam <= 3, `fausses commandes en rafale limitées (acceptées : ${spam}/8)`)
const huge = await attacker.c.rpc('place_market_order', { p_store: store.id, p_items: [{ product_id: prod.id, qty: 1 }], p_address: 'x'.repeat(100_000), p_phone: '+241' })
ok(!!huge.error, 'adresse géante (100 000 caractères) refusée')
const exp = await victim.c.rpc('place_express_order', { p_pickup: 'Owendo', p_dropoff: 'Akanda', p_size: 's', p_speed: 'standard', p_km: 1, p_phone: '+241' })
console.log(`ℹ NEAM Express : la distance est déclarée par le client (Owendo → Akanda annoncé à 1 km : ${exp.data?.total ?? '?'} FCFA). À contrôler par l’admin avant affectation.`)
let apps = 0
for (let i = 0; i < 6; i++) if (!(await attacker.c.rpc('submit_application', { p_kind: 'courier', p_full_name: 'Spam', p_phone: '+241', p_details: {} })).error) apps++
ok(apps <= 1, `candidatures en double limitées (acceptées : ${apps}/6)`)

console.log(failures ? `\n${failures} faille(s) détectée(s).` : '\nAucune faille détectée.')
process.exit(failures ? 1 : 0)
