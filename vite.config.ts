import { defineConfig } from 'vite';
import liteforge from 'liteforge/vite-plugin';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss(), liteforge()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    target: 'es2022',
  },
});
