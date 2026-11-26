import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      watch: { usePolling: env.WATCH_POLL === 'true' },
      proxy: {
        '/api': {
          target: env.API_PROXY_TARGET || 'http://127.0.0.1:3000',
          configure(proxy) {
            proxy.on('proxyReq', (proxyRequest, request) => {
              proxyRequest.removeHeader('forwarded');
              proxyRequest.setHeader('x-forwarded-for', request.socket.remoteAddress ?? '127.0.0.1');
            });
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      include: ['src/**/*.test.tsx'],
      setupFiles: ['src/test-setup.ts'],
    },
  };
});
