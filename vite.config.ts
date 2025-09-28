import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [
    react(), 
    process.env.NODE_ENV === 'production' ? cloudflare() : undefined
  ].filter(Boolean),
  server: {
    port: 5174,
    strictPort: true,
    cors: {
      origin: ['http://localhost:8787', 'http://localhost:5174'],
      credentials: true,
    },
    proxy: {
      // Proxy API calls to Worker
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        secure: false,
      },
    },
    // Configure history API fallback to handle all routes through React Router
    // This makes Vite serve the React app for all routes just like Worker does
    historyApiFallback: {
      // All routes should serve index.html and let React Router handle routing
      rewrites: [
        // API routes go to proxy (handled above)
        { from: /^\/api\/.*$/, to: '/api/' },
        // All other routes serve index.html for React Router
        { from: /./, to: '/index.html' }
      ]
    }
  },
  build: {
    outDir: 'dist/client',
  },
});
