import React from "react";
import { StaticRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import App from "../App";

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h1>Navette Tunisie</h1>
          <p>An error occurred while loading the application.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const ServerApp: React.FC<{ url: string }> = ({ url }) => {
  const helmetContext = {};
  return (
    <ErrorBoundary>
      <HelmetProvider context={helmetContext}>
        <StaticRouter location={url}>
          <App />
        </StaticRouter>
      </HelmetProvider>
    </ErrorBoundary>
  );
};

export default ServerApp;