/// <reference types="node" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

const certDir = path.resolve(__dirname, 'certs');
const useHttps = process.env.MBTAI_HTTPS === '1';
const httpsConfig =
  useHttps && fs.existsSync(path.join(certDir, 'cert.pem'))
    ? {
        key: fs.readFileSync(path.join(certDir, 'key.pem')),
        cert: fs.readFileSync(path.join(certDir, 'cert.pem')),
      }
    : undefined;

export default defineConfig({
  plugins: [react()],
  optimizeDeps: { exclude: ['lucide-react'] },
  server: {
    host: true, // bind 0.0.0.0 so phones on the LAN can reach it
    port: 5173,
    https: httpsConfig,
    proxy: {
      // /api/* -> backend on localhost:3001 (single-port architecture)
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
