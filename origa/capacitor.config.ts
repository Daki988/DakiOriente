import type { CapacitorConfig } from '@capacitor/cli';

// Une seule base de code : Android (APK, compatible HarmonyOS 2 sans services Google), iOS et web.
const config: CapacitorConfig = {
  appId: 'ga.origa.app',
  appName: 'Origa',
  webDir: 'dist',
  backgroundColor: '#F5F7F6',
  android: { allowMixedContent: false },
  ios: { contentInset: 'automatic' },
};

export default config;
