import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { USE_MOCK } from './lib/http';
import './index.css';

// No modo demonstração, já começa a baixar a API simulada enquanto a tela monta.
if (USE_MOCK) import('./mocks/server.js');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
