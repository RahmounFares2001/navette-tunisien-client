import { hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { I18nextProvider } from 'react-i18next';
import { CurrencyProvider } from './components/currency/CurrencyContext.tsx';
import { Providers } from './globalRedux/Providers.tsx';
import App from './App.tsx';
import i18n from './i18n/index.ts';
import React from 'react';
import './index.css';

declare global {
  interface Window {
    __PRELOADED_STATE__?: any;
  }
}

const rootElement = document.getElementById('root')!;

if (typeof window !== 'undefined' && window.__PRELOADED_STATE__) {
  delete window.__PRELOADED_STATE__;
}

hydrateRoot(
  rootElement,
  <React.StrictMode>
    <Providers>
      <HelmetProvider>
        <I18nextProvider i18n={i18n}>
          <CurrencyProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </CurrencyProvider>
        </I18nextProvider>
      </HelmetProvider>
    </Providers>
  </React.StrictMode>
);