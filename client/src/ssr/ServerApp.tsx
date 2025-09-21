import React from 'react';
import { StaticRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from '@/App';
import { CurrencyProvider } from '@/components/currency/CurrencyContext';

interface ServerAppProps {
  url: string;
}

const ServerApp: React.FC<ServerAppProps> = ({ url }) => {
  const helmetContext = {};
  
  return (
    <HelmetProvider context={helmetContext}>
      <CurrencyProvider>
        <StaticRouter location={url}>
          <App />
        </StaticRouter>
      </CurrencyProvider>
    </HelmetProvider>
  );
};

// named and default exports
export { ServerApp };
export default ServerApp;