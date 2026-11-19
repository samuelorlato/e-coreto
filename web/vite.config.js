import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Para onde o proxy encaminha "/api" (a API Java). Mude com API_PROXY_TARGET no .env.local.
  const apiTarget = env.API_PROXY_TARGET || 'http://localhost:8080';
  // O navegador chama /api no mesmo endereço do front e o Vite repassa para a API Java:
  // sem problemas de CORS e sem a requisição extra de "preflight" a cada chamada.
  const proxy = { '/api': { target: apiTarget, changeOrigin: true } };

  return {
    // Caminhos relativos: o build funciona em qualquer pasta/servidor estático.
    base: './',
    plugins: [react(), tailwindcss()],
    server: { port: 5173, open: false, proxy },
    preview: { port: 4173, proxy },
  };
});
