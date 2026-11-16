import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' + HashRouter => يعمل على GitHub Pages أو أي استضافة ثابتة بدون إعدادات
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: { react: ['react', 'react-dom', 'react-router-dom'] },
      },
    },
  },
});
