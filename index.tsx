import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { OutlookAuthPage } from './components/OutlookAuthPage';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const isOutlookAuth = typeof window !== 'undefined' && window.location.pathname === '/auth/outlook';

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {isOutlookAuth ? <OutlookAuthPage /> : <App />}
  </React.StrictMode>
);