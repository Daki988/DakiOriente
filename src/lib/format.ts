const nf = new Intl.NumberFormat('fr-FR')

export const fcfa = (n: number) => (n === 0 ? 'Gratuit' : `${nf.format(n)} FCFA`)

export const timeAgo = (ts: number) => {
  const m = Math.round((Date.now() - ts) / 60000)
  if (m < 1) return 'à l’instant'
  if (m < 60) return `il y a ${m} min`
  const h = Math.round(m / 60)
  if (h < 24) return `il y a ${h} h`
  return new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

/** Montant comptable : 0 s'affiche « 0 FCFA » (et non « Gratuit » comme pour un prix). */
export const money = (n: number) => `${nf.format(n)} FCFA`

/** +24107000003 → +241 07 00 00 03 */
export const formatPhone = (raw?: string | null) => {
  if (!raw) return ''
  const d = raw.replace(/\D/g, '')
  if (!d.startsWith('241')) return raw
  return '+241 ' + d.slice(3).replace(/(\d{2})(?=\d)/g, '$1 ').trim()
}
