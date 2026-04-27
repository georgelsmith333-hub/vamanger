import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vamanger.app',
  appName: 'VA Manager',
  webDir: 'dist/public',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1000,
      launchAutoHide: true,
      backgroundColor: '#0F172A',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      spinnerColor: '#0EA5E9',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0F172A',
    },
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#0F172A',
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#0F172A',
  },
};

export default config;
