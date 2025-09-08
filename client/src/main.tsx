import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { HelmetProvider } from 'react-helmet-async';
import { CurrencyProvider } from './components/currency/CurrencyContext.tsx';

createRoot(document.getElementById("root")!).render(
    <HelmetProvider> 
        <CurrencyProvider>
            <App />
        </CurrencyProvider>       
    </HelmetProvider>  
);
