import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { AppProvider } from './context/AppContext.jsx';
import App from './App.jsx';
import './styles/app.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </AppProvider>
  </React.StrictMode>,
);
