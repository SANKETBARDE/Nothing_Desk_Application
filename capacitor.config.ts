import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'tech.nothing.desk',
  appName: 'Nothing Desk',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
  backgroundColor: '#000000',
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      backgroundColor: '#000000',
    },
  },
};

export default config;
