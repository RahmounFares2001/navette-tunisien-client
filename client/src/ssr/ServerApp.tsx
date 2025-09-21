import React from 'react';
import { StaticRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { CurrencyProvider } from '../components/currency/CurrencyContext';
import App from '../App';

interface ServerAppProps {
  url: string;
}

const ServerApp = ({ url }: ServerAppProps) => {
  return (
    <HelmetProvider>
      <CurrencyProvider>
        <StaticRouter location={url}>
          <App />
        </StaticRouter>
      </CurrencyProvider>
    </HelmetProvider>
  );
};

export default ServerApp;