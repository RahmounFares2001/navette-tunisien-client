// src/entry-client.tsx
import { hydrateRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { I18nextProvider } from 'react-i18next';
import { CurrencyProvider } from './components/currency/CurrencyContext.tsx';
import { RouterWrapper } from './components/RouterWrapper.tsx';
import { Providers } from './globalRedux/Providers.tsx';
import App from './App.tsx';
import i18n from './i18n/index.ts';
import React from 'react';
import './index.css';

const rootElement = document.getElementById('root')!;
if (!rootElement.hasAttribute('data-hydrated')) {
  hydrateRoot(
    rootElement,
    <React.StrictMode>
      <Providers>
        <HelmetProvider>
          <I18nextProvider i18n={i18n}>
            <CurrencyProvider>
              <RouterWrapper>
                <App />
              </RouterWrapper>
            </CurrencyProvider>
          </I18nextProvider>
        </HelmetProvider>
      </Providers>
    </React.StrictMode>
  );
  rootElement.setAttribute('data-hydrated', 'true');
}