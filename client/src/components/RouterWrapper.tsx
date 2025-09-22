import { BrowserRouter } from 'react-router-dom';
import { ReactNode } from 'react';

interface RouterWrapperProps {
  children: ReactNode;
}

export const RouterWrapper = ({ children }: RouterWrapperProps) => {
  // Only use BrowserRouter on the client side
  if (typeof window === 'undefined') {
    // Server-side: return children without router (StaticRouter handles this in entry-server)
    return <>{children}</>;
  }

  // Client-side: wrap with BrowserRouter
  return <BrowserRouter>{children}</BrowserRouter>;
};