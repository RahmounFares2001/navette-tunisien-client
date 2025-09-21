import React from 'react';
import { StaticRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { CurrencyProvider } from '../components/currency/CurrencyContext';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from 'react-i18next';
import { Providers } from '../globalRedux/Providers';
import App from '../App'; // Import your real App
import i18n from '../i18n';

interface ServerAppProps {
  url: string;
}

const ServerApp: React.FC<ServerAppProps> = ({ url }) => {
  const helmetContext = {};
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        retry: false,
      },
    },
  });

  try {
    return (
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <Providers>
            <HelmetProvider context={helmetContext}>
              <CurrencyProvider>
                <StaticRouter location={url}>
                  <App />
                </StaticRouter>
              </CurrencyProvider>
            </HelmetProvider>
          </Providers>
        </I18nextProvider>
      </QueryClientProvider>
    );
  } catch (error) {
    console.error('ServerApp render error:', error);
    
    // Minimal fallback only if the real app fails
    return (
      <div>
        <h1>Navette Tunisie</h1>
        <p>Service de transport en Tunisie</p>
        <p>Loading application...</p>
      </div>
    );
  }
};

export default ServerApp;