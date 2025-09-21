import React from 'react';
import { StaticRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from '../App';

interface ServerAppProps {
  url: string;
}

const ServerApp: React.FC<ServerAppProps> = ({ url }) => {
  const helmetContext = {};
  
  return (
    <HelmetProvider context={helmetContext}>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </HelmetProvider>
  );
};

export default ServerApp;