import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  plugins: [
    VitePWA({
      includeAssets: ['logo.svg', 'logo-192.png', 'logo-512.png', 'wooordle.png'],
      registerType: 'autoUpdate',
      manifest: {
        name: 'Wooordle',
        short_name: 'Wooordle',
        description: 'Play Wooordle',
        theme_color: '#538d4e',
        icons: [
          {
            src: 'logo-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'logo-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
});
