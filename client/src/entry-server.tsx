// src/entry-server.tsx
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import { I18nextProvider } from 'react-i18next';
import { CurrencyProvider } from './components/currency/CurrencyContext.tsx';
import { Providers } from './globalRedux/Providers.tsx';
import App from './App.tsx';
import i18n from './i18n/index.ts';
import { store } from './globalRedux/store';
import { apiSlice } from './globalRedux/features/api/apiSlice';
import React from 'react';
import './index.css';

export async function render(url: string) {
  const helmetContext = {};

  // Pre-fetch blog data for /blogs/:id or /blogs/:id/:slug
  const blogMatch = url.match(/^\/blogs\/([^/]+)/);
  if (blogMatch) {
    const id = blogMatch[1];
    try {
      await store.dispatch(apiSlice.endpoints.getBlog.initiate(id)).unwrap();
    } catch (e) {
      console.error('SSR pre-fetch error:', e);
    }
  }

  const appHtml = renderToString(
    <React.StrictMode>
      <Providers>
        <HelmetProvider context={helmetContext}>
          <I18nextProvider i18n={i18n}>
            <CurrencyProvider>
              <StaticRouter location={url}>
                <App />
              </StaticRouter>
            </CurrencyProvider>
          </I18nextProvider>
        </HelmetProvider>
      </Providers>
    </React.StrictMode>
  );

  const initialState = store.getState();
  const serializedState = JSON.stringify(initialState).replace(/</g, '\\u003c');
  const { helmet } = helmetContext as any;

  return `
    <!DOCTYPE html>
    <html ${helmet?.htmlAttributes?.toString() || ''}>
      <head>
        ${helmet?.title?.toString() || ''}
        ${helmet?.meta?.toString() || ''}
        ${helmet?.link?.toString() || ''}
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        <div id="root">${appHtml}</div>
        <script>
          window.__PRELOADED_STATE__ = ${serializedState};
        </script>
        <script type="module" src="/src/entry-client.tsx"></script>
      </body>
    </html>
  `;
}