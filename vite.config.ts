import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

const supabaseTarget =
  process.env.VITE_SUPABASE_URL ?? 'https://nxzvpcbudbqotujuuczo.supabase.co';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/functions/v1': {
          target: supabaseTarget,
          changeOrigin: true,
          secure: true,
        },
      },
    },
    build: {
      modulePreload: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('/src/App.tsx')) {
              return 'app';
            }
          },
        },
      },
    },
  };
});
