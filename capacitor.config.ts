import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aurevon.thelastbutton',
  appName: 'THE LAST BUTTON',
  webDir: 'dist',
  bundledWebRuntime: false,
  android: {
    backgroundColor: '#09090d',
    allowMixedContent: false,
  },
};

export default config;
