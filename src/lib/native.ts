import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { StatusBar, Style } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'
import { App } from '@capacitor/app'

export const isNative = Capacitor.isNativePlatform()

/** Vibration légère au toucher (natif uniquement). */
export const tap = () => {
  if (isNative) Haptics.impact({ style: ImpactStyle.Light }).catch(() => {})
}

export async function initNative(onBack: () => void) {
  if (!isNative) return
  try {
    await StatusBar.setStyle({ style: Style.Dark })
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: '#04241b' })
    }
  } catch {
    /* plugin indisponible */
  }
  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) onBack()
    else App.exitApp()
  })
  SplashScreen.hide().catch(() => {})
}

export function registerServiceWorker() {
  if (isNative || !import.meta.env.PROD || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {})
  })
}
