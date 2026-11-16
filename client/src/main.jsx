import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, MemoryRouter } from 'react-router-dom';

// المعاينة داخل Artifact لا تدعم مسارات الـ hash، فنستخدم راوتر في الذاكرة هناك
const Router = globalThis.__NZ_ARTIFACT ? MemoryRouter : HashRouter;
import { AppProvider } from './context/AppContext.jsx';
import App from './App.jsx';
import './styles/app.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider>
      <Router>
        <App />
      </Router>
    </AppProvider>
  </React.StrictMode>,
);
