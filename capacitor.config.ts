import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.neam.superapp',
  appName: 'NEAM',
  webDir: 'dist',
  backgroundColor: '#04241b',
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#04241b',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#04241b',
    },
  },
}

export default config
