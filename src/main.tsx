import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register SATA PWA Service Worker for Offline Execution and Push Alerts
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[SATA SW] Registered successfully with scope:', registration.scope);
      })
      .catch((error) => {
        console.warn('[SATA SW] Registration skipped or failed. This is common in secured sandboxed iframe previews:', error);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

