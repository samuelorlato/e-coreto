import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Caminhos relativos: o build funciona em qualquer pasta/servidor estático.
  base: './',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    open: false,
  },
});
