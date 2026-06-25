import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

const supabaseTarget =
  process.env.VITE_SUPABASE_URL ?? 'https://nxzvpcbudbqotujuuczo.supabase.co';

/** Vite adds crossorigin to module scripts; that disables cookies on dynamic imports. */
function stripCrossoriginPlugin() {
  return {
    name: 'strip-crossorigin',
    transformIndexHtml: {
      order: 'post' as const,
      handler(html: string) {
        return html.replace(/\s+crossorigin/g, '');
      },
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), stripCrossoriginPlugin()],
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
    },
  };
});
