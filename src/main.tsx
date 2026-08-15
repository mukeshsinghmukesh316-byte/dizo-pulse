import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { AdminAuthProvider } from './context/AdminAuthContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <AdminAuthProvider>
        <App />
      </AdminAuthProvider>
    </AuthProvider>
  </StrictMode>,
);

