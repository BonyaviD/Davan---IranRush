import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Placeholder id: change to your own reverse-domain id before publishing.
  appId: 'com.example.davan',
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
