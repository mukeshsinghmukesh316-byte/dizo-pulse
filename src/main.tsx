import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { AdminAuthProvider } from './context/AdminAuthContext.tsx';
import './index.css';

// Safely intercept window.fetch to automatically include X-Session-Token header for admin API requests
if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
  try {
    const originalFetch = window.fetch.bind(window);
    const customFetch: typeof window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
      try {
        const token = sessionStorage.getItem('dizopulse_session_token');
        if (token) {
          let urlStr = '';
          if (typeof input === 'string') {
            urlStr = input;
          } else if (input instanceof URL) {
            urlStr = input.pathname;
          } else if (input && typeof (input as Request).url === 'string') {
            urlStr = (input as Request).url;
          }

          if (urlStr.includes('/api/')) {
            init = init || {};
            const headers = new Headers(init.headers || (input instanceof Request ? input.headers : {}));
            if (!headers.has('X-Session-Token')) {
              headers.set('X-Session-Token', token);
            }
            init.headers = headers;
          }
        }
      } catch {
        // Ignore if sessionStorage or Headers is inaccessible
      }
      return originalFetch(input, init);
    };

    try {
      Object.defineProperty(window, 'fetch', {
        value: customFetch,
        writable: true,
        configurable: true,
        enumerable: true
      });
    } catch {
      try {
        (window as any).fetch = customFetch;
      } catch {
        // Silently skip if the runtime environment strictly forbids overriding fetch
      }
    }
  } catch {
    // Graceful fallback
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <AdminAuthProvider>
        <App />
      </AdminAuthProvider>
    </AuthProvider>
  </StrictMode>,
);


