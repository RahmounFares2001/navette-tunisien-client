import React from 'react';
import { StaticRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { CurrencyProvider } from '../components/currency/CurrencyContext';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Simple version without complex dependencies for SSR
const SimpleApp = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ marginBottom: '20px' }}>
        <h1>Navette Tunisie - Service de Transport</h1>
        <nav>
          <a href="/" style={{ marginRight: '15px' }}>Accueil</a>
          <a href="/transfers" style={{ marginRight: '15px' }}>Transferts</a>
          <a href="/excursions" style={{ marginRight: '15px' }}>Excursions</a>
          <a href="/about" style={{ marginRight: '15px' }}>À propos</a>
          <a href="/contact">Contact</a>
        </nav>
      </header>
      <main>
        <p>Service de transport et navette en Tunisie - Réservez votre transport fiable et confortable.</p>
        <div style={{ marginTop: '20px', color: '#666' }}>
          Application en cours de chargement...
        </div>
      </main>
    </div>
  );
};

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
    // Try to render with minimal providers
    return (
      <QueryClientProvider client={queryClient}>
        <HelmetProvider context={helmetContext}>
          <CurrencyProvider>
            <StaticRouter location={url}>
              <SimpleApp />
            </StaticRouter>
          </CurrencyProvider>
        </HelmetProvider>
      </QueryClientProvider>
    );
  } catch (error) {
    console.error('ServerApp render error:', error);
    // Fallback to simple content
    return <SimpleApp />;
  }
};

export default ServerApp;