import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // App id used by both stores. Change before publishing if you own a domain for it.
  appId: 'com.davan.iranrush',
  appName: 'Davan',
  webDir: 'dist',
  backgroundColor: '#1d2a52',
  android: {
    backgroundColor: '#1d2a52',
  },
  ios: {
    backgroundColor: '#1d2a52',
    contentInset: 'never',
  },
  plugins: {
    StatusBar: { overlaysWebView: true },
  },
};

export default config;
