import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pic/favicon.png', 'pic/HDO_new.png'],
      workbox: {
        // Skip waiting and claim clients immediately
        skipWaiting: true,
        clientsClaim: true,
        // Clear old caches on update
        cleanupOutdatedCaches: true,
        // Network-first strategy for all requests
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'app-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 // 1 hour
              },
              networkTimeoutSeconds: 3
            }
          }
        ]
      },
      manifest: {
        name: 'HD현대 계장설비 유틸리티',
        short_name: 'HDO 유틸',
        description: 'Industrial Instrumentation & Control Utility SPA',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: '/pic/HDO_new.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/pic/HDO_new.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  // Build options for cache busting
  build: {
    rollupOptions: {
      output: {
        // Always include content hash in filenames
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
})
