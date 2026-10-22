// Test de bout en bout du serveur NEAM (Supabase local).
// Prérequis : `npx supabase start` puis `npx supabase db reset`.
// Lancer : node scripts/test-backend.mjs
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

async function login(phone) {
  const c = createClient(URL, KEY, { auth: { persistSession: false } })
  const { error: e1 } = await c.auth.signInWithOtp({ phone })
  if (e1) throw new Error(`OTP ${phone}: ${e1.message}`)
  const { data, error } = await c.auth.verifyOtp({ phone, token: '123456', type: 'sms' })
  if (error) throw new Error(`verify ${phone}: ${error.message}`)
  return { c, id: data.user.id }
}

const admin = await login('24107000001')
const client = await login('24107000002')
const merchant = await login('24107000003')
const courier = await login('24107000004')
const other = await login('24107000005')

sql(`update public.profiles set role = 'admin', full_name = 'Admin NEAM' where id = '${admin.id}'`)
ok((await admin.c.rpc('my_role')).data === 'admin', 'admin promu par SQL')
ok((await client.c.rpc('my_role')).data === 'client', 'nouveau compte = client')

// --- Candidatures
const m1 = await merchant.c.rpc('submit_application', { p_kind: 'merchant', p_full_name: 'Awa Ndong', p_phone: '+24107000003', p_details: { store_name: 'Épicerie Awa', district: 'Glass', address: 'Rue Pecqueur' } })
ok(!m1.error, 'candidature marchand envoyée')
const c1 = await courier.c.rpc('submit_application', { p_kind: 'courier', p_full_name: 'Junior Mba', p_phone: '+24107000004', p_details: { vehicle: 'Moto', plate: 'GA-1234' } })
ok(!c1.error, 'candidature livreur envoyée')
const badReview = await client.c.rpc('admin_review_application', { p_application: m1.data.id, p_approve: true })
ok(!!badReview.error, 'un client ne peut pas valider une candidature')
ok(!(await admin.c.rpc('admin_review_application', { p_application: m1.data.id, p_approve: true })).error, 'admin valide le marchand')
ok(!(await admin.c.rpc('admin_review_application', { p_application: c1.data.id, p_approve: true })).error, 'admin valide le livreur')
ok((await merchant.c.rpc('my_role')).data === 'merchant', 'rôle marchand actif')
ok((await courier.c.rpc('my_role')).data === 'courier', 'rôle livreur actif')

// --- Catalogue du marchand
const { data: store } = await merchant.c.from('stores').select('*').eq('owner_id', merchant.id).single()
ok(store?.name === 'Épicerie Awa', 'boutique créée pour le marchand')
const p1 = await merchant.c.from('products').insert({ store_id: store.id, name: 'Riz parfumé', category: 'Produits alimentaires', unit: '5 kg', emoji: '🍚', price: 4250 }).select().single()
const p2 = await merchant.c.from('products').insert({ store_id: store.id, name: 'Huile végétale', category: 'Produits alimentaires', unit: '1 L', emoji: '🫗', price: 1200 }).select().single()
ok(!p1.error && !p2.error, 'le marchand ajoute des produits')
const hijack = await merchant.c.from('products').insert({ store_id: '11111111-1111-4111-8111-000000000001', name: 'Intrus', category: 'x', price: 1 })
ok(!!hijack.error, 'le marchand ne peut pas ajouter de produit dans une autre boutique')
const tamper = await client.c.from('products').update({ price: 1 }).eq('id', p1.data.id).select()
ok(!tamper.data?.length, 'un client ne peut pas modifier un prix')

// --- Commande Market
const ord = await client.c.rpc('place_market_order', {
  p_store: store.id, p_items: [{ product_id: p1.data.id, qty: 2 }, { product_id: p2.data.id, qty: 1, price: 1 }],
  p_address: 'Quartier Louis, face pharmacie', p_phone: '+24107000002', p_name: 'Grâce',
})
ok(!ord.error, 'le client passe commande')
const o = ord.data
ok(o.items_total === 9700 && o.delivery_fee === 1000 && o.total === 10700, `prix recalculés côté serveur (${o.items_total} + ${o.delivery_fee})`)
ok(o.commission === 970, 'commission NEAM 10 %')
ok(!(await other.c.from('orders').select('id').eq('id', o.id)).data?.length, 'un autre client ne voit pas la commande')
ok((await merchant.c.from('orders').select('id').eq('id', o.id)).data?.length === 1, 'le marchand voit la commande')
ok(!(await courier.c.from('orders').select('id').eq('id', o.id)).data?.length, 'le livreur ne la voit pas avant affectation')
const code = (await client.c.from('order_secrets').select('delivery_code').eq('order_id', o.id).single()).data?.delivery_code
ok(/^\d{4}$/.test(code ?? ''), 'le client voit son code de remise')

ok(!!(await client.c.rpc('merchant_update_order', { p_order: o.id, p_action: 'accept' })).error, 'le client ne peut pas accepter sa propre commande')
ok(!!(await admin.c.rpc('admin_assign_courier', { p_order: o.id, p_courier: courier.id })).error, 'impossible d’affecter avant acceptation')
ok((await merchant.c.rpc('merchant_update_order', { p_order: o.id, p_action: 'accept' })).data?.status === 'accepted', 'le marchand accepte')
ok((await admin.c.rpc('admin_assign_courier', { p_order: o.id, p_courier: courier.id })).data?.status === 'assigned', 'l’admin affecte le livreur')
ok(!(await courier.c.from('order_secrets').select('delivery_code').eq('order_id', o.id)).data?.length, 'le livreur ne peut pas lire le code de remise')
ok(!!(await courier.c.rpc('courier_update_order', { p_order: o.id, p_action: 'pickup' })).error, 'récupération refusée tant que ce n’est pas prêt')
ok(!(await merchant.c.rpc('merchant_update_order', { p_order: o.id, p_action: 'ready' })).error, 'le marchand signale « prête »')
ok((await courier.c.rpc('courier_update_order', { p_order: o.id, p_action: 'pickup' })).data?.status === 'picked_up', 'le livreur récupère')
await courier.c.rpc('courier_update_location', { p_lat: 0.39, p_lng: 9.45 })
const pub = await client.c.rpc('courier_public', { p_order: o.id })
ok(pub.data?.[0]?.full_name === 'Junior Mba' && pub.data?.[0]?.lat === 0.39, 'le client voit le nom et la position du livreur')
ok(!!(await courier.c.rpc('courier_update_order', { p_order: o.id, p_action: 'deliver', p_code: '0000' === code ? '1111' : '0000' })).error, 'mauvais code refusé')
ok((await courier.c.rpc('courier_update_order', { p_order: o.id, p_action: 'deliver', p_code: code })).data?.status === 'delivered', 'livraison validée avec le bon code')
const events = (await client.c.from('order_events').select('status').eq('order_id', o.id).order('id')).data?.map((e) => e.status)
ok(events?.join(',') === 'pending,accepted,assigned,assigned,picked_up,delivered', `journal des étapes (${events})`)

// --- Argent
ok((await admin.c.rpc('courier_cash_due', { p_courier: courier.id })).data === 10700, 'espèces dues par le livreur = 10 700')
ok(!!(await admin.c.rpc('admin_record_remittance', { p_courier: courier.id, p_amount: 20000 })).error, 'remise supérieure aux espèces dues refusée')
ok(!(await admin.c.rpc('admin_record_remittance', { p_courier: courier.id, p_amount: 10700 })).error, 'remise des espèces enregistrée')
ok((await admin.c.rpc('courier_cash_due', { p_courier: courier.id })).data === 0, 'solde livreur à zéro')
const fin = (await merchant.c.rpc('store_finances', { p_store: store.id })).data?.[0]
ok(fin?.sales === 9700 && fin?.net === 8730 && fin?.balance === 8730, 'finances marchand : ventes 9 700, net 8 730')
ok(!(await other.c.rpc('store_finances', { p_store: store.id })).data?.length, 'un client ne voit pas les finances d’une boutique')

// --- Express
const ex = await client.c.rpc('place_express_order', { p_pickup: 'Louis', p_dropoff: 'Glass', p_size: 's', p_speed: 'express', p_km: 6, p_phone: '+24107000002' })
ok(!ex.error && ex.data.total === 6400, `devis express calculé côté serveur (${ex.data?.total})`)
ok((await admin.c.rpc('admin_assign_courier', { p_order: ex.data.id, p_courier: courier.id })).data?.status === 'assigned', 'express : livreur affecté')
ok((await courier.c.rpc('courier_update_order', { p_order: ex.data.id, p_action: 'pickup' })).data?.status === 'picked_up', 'express : colis récupéré')

// --- Annulation
const ord2 = await client.c.rpc('place_market_order', { p_store: store.id, p_items: [{ product_id: p1.data.id, qty: 4 }], p_address: 'Glass', p_phone: '+241' })
ok(ord2.data?.delivery_fee === 0, 'livraison offerte dès 15 000 FCFA')
ok(!!(await other.c.rpc('cancel_my_order', { p_order: ord2.data.id })).error, 'un autre client ne peut pas annuler')
ok((await client.c.rpc('cancel_my_order', { p_order: ord2.data.id })).data?.status === 'cancelled', 'le client annule une commande en attente')

// --- Indicateurs admin
const stats = (await admin.c.rpc('admin_stats', { p_from: new Date(Date.now() - 86400000).toISOString(), p_to: new Date(Date.now() + 60000).toISOString() })).data?.[0]
ok(stats?.delivered === 1 && stats?.gmv === 10700 && stats?.commission === 970, 'tableau de bord admin : 1 livrée, 10 700 FCFA')
ok(!(await client.c.rpc('admin_stats', { p_from: new Date(0).toISOString(), p_to: new Date().toISOString() })).data?.length, 'un client n’a pas accès aux statistiques')
ok((await admin.c.rpc('admin_couriers')).data?.length === 1, 'liste des livreurs (admin)')

console.log(failures ? `\n${failures} échec(s)` : '\nTous les tests passent.')
process.exit(failures ? 1 : 0)
