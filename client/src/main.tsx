import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { HelmetProvider } from 'react-helmet-async';
import { CurrencyProvider } from './components/currency/CurrencyContext.tsx';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n/index.ts';

createRoot(document.getElementById('root')!).render(
  <HelmetProvider>
    <I18nextProvider i18n={i18n}>
      <CurrencyProvider>
        <App />
      </CurrencyProvider>
    </I18nextProvider>
  </HelmetProvider>
);