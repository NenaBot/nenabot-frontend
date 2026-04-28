import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = {
    ...loadEnv(mode, process.cwd(), ''),
    ...process.env,
  };

  return {
    plugins: [react(), tailwindcss()],
    define: {
      __APP_ENV__: JSON.stringify({
        VITE_API_URL: env.VITE_API_URL ?? '',
        VITE_API_TIMEOUT: env.VITE_API_TIMEOUT ?? '',
        VITE_USE_MOCK_DATA: env.VITE_USE_MOCK_DATA ?? '',
        MODE: mode,
        DEV: mode !== 'production',
        PROD: mode === 'production',
      }),
    },
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      target: 'esnext',
      outDir: 'build',
    },
    server: {
      port: 3000,
      open: true,
    },
  };
});
