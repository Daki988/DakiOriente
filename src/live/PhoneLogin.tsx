import { useState } from 'react'
import { ArrowRight, Loader2, Phone, ShieldCheck } from 'lucide-react'
import { errMsg, normalizePhone, sb } from './supabase'

/** Connexion par numéro de téléphone + code SMS à 6 chiffres. */
export function PhoneLogin({ onDone, accent = '#079b5a', title = 'Connexion', subtitle = 'Recevez un code par SMS pour vous connecter.' }: { onDone?: () => void; accent?: string; title?: string; subtitle?: string }) {
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const send = async () => {
    const p = normalizePhone(phone)
    if (p.length < 11) return setError('Numéro incomplet (ex. 077 12 34 56).')
    setBusy(true)
    setError('')
    const { error } = await sb().auth.signInWithOtp({ phone: p })
    setBusy(false)
    if (error) return setError(errMsg(error))
    setStep('code')
  }

  const verify = async () => {
    if (!/^\d{6}$/.test(code)) return setError('Le code contient 6 chiffres.')
    setBusy(true)
    setError('')
    const { error } = await sb().auth.verifyOtp({ phone: normalizePhone(phone), token: code, type: 'sms' })
    setBusy(false)
    if (error) return setError(errMsg(error))
    onDone?.()
  }

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-1 text-sm text-neutral-500">{step === 'phone' ? subtitle : `Code envoyé au +${normalizePhone(phone)}.`}</p>
      <form
        className="mt-5 space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          if (step === 'phone') send()
          else verify()
        }}
      >
        {step === 'phone' ? (
          <label className="flex h-14 items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 focus-within:border-neutral-400">
            <Phone size={18} className="text-neutral-400" />
            <span className="font-semibold text-neutral-700">+241</span>
            <input
              id="login-phone"
              autoFocus
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="077 12 34 56"
              className="h-full flex-1 bg-transparent text-lg tracking-wide outline-none"
            />
          </label>
        ) : (
          <input
            id="login-code"
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="••••••"
            className="h-14 w-full rounded-2xl border border-neutral-200 bg-white text-center text-2xl font-bold tracking-[0.5em] outline-none focus:border-neutral-400"
          />
        )}
        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600" role="alert">{error}</p>}
        <button disabled={busy} className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl font-semibold text-white shadow-lg disabled:opacity-70" style={{ background: accent }}>
          {busy ? <Loader2 className="animate-spin" size={20} /> : step === 'phone' ? <>Recevoir le code <ArrowRight size={18} /></> : 'Se connecter'}
        </button>
        {step === 'code' && (
          <button type="button" onClick={() => { setStep('phone'); setCode(''); setError('') }} className="w-full py-2 text-sm font-medium text-neutral-500">
            Modifier le numéro
          </button>
        )}
      </form>
      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-neutral-400"><ShieldCheck size={14} /> Votre numéro reste confidentiel.</p>
    </div>
  )
}
