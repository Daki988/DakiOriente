import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'

export type Pos = { lat: number; lng: number; accuracy: number }

/** Suit la position (natif via Capacitor, sinon API du navigateur). Renvoie une fonction d'arrêt. */
export async function watchPosition(onPos: (p: Pos) => void, onError: (msg: string) => void): Promise<() => void> {
  if (Capacitor.isNativePlatform()) {
    try {
      const perm = await Geolocation.requestPermissions()
      if (perm.location !== 'granted') {
        onError('Autorisez la localisation pour partager votre position avec les clients.')
        return () => {}
      }
      const id = await Geolocation.watchPosition({ enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 }, (pos, err) => {
        if (err) return onError('Position indisponible.')
        if (pos) onPos({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy })
      })
      return () => void Geolocation.clearWatch({ id })
    } catch {
      onError('Position indisponible.')
      return () => {}
    }
  }
  if (!('geolocation' in navigator)) {
    onError('Ce navigateur ne permet pas la localisation.')
    return () => {}
  }
  const id = navigator.geolocation.watchPosition(
    (pos) => onPos({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
    (e) => onError(e.code === e.PERMISSION_DENIED ? 'Autorisez la localisation pour partager votre position avec les clients.' : 'Position indisponible.'),
    { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 },
  )
  return () => navigator.geolocation.clearWatch(id)
}
