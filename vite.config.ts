import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['skopos-icon.svg'],
        manifest: {
          name: "SKOPOS - L'Essentiel",
          short_name: "SKOPOS",
          description: "Un outil pour reprendre le cap, fixer des intentions et devenir l'acteur de ses journées.",
          lang: "fr",
          theme_color: "#1C1917",
          background_color: "#F5F5F0",
          display: "standalone",
          icons: [
            {
              src: "/skopos-icon.svg",
              sizes: "any",
              type: "image/svg+xml"
            },
            {
              src: "/skopos-icon.svg",
              sizes: "any",
              type: "image/svg+xml",
              purpose: "any maskable"
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify — file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
