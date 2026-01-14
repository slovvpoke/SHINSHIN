import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Play from './pages/Play';
import './index.css';

const P = lazy(() => import('./pages/Host'));

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/play" element={<Play />} />
        <Route path="/h" element={
          <Suspense fallback={<div style={{ background: '#08080c', minHeight: '100vh' }} />}>
            <P />
          </Suspense>
        } />
        <Route path="*" element={<Navigate to="/play" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
