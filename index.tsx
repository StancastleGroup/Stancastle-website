import './index.css';
import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const OutlookAuthPage = lazy(() => import('./components/OutlookAuthPage').then((m) => ({ default: m.OutlookAuthPage })));
const PrepPage = lazy(() => import('./components/PrepPage').then((m) => ({ default: m.PrepPage })));

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
const isOutlookAuth = pathname === '/auth/outlook';
const isPrep = pathname === '/prep';

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {isOutlookAuth ? (
      <Suspense fallback={<div className="min-h-screen bg-[#050508] flex items-center justify-center text-[#94a3b8]">Loading…</div>}>
        <OutlookAuthPage />
      </Suspense>
    ) : isPrep ? (
      <Suspense fallback={<div className="min-h-screen bg-[#050508] flex items-center justify-center text-[#94a3b8]">Loading…</div>}>
        <PrepPage />
      </Suspense>
    ) : (
      <App />
    )}
  </React.StrictMode>
);