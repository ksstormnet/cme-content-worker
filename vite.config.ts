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
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist/client',
  },
});
