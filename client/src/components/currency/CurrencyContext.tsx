import { createContext, useState, useEffect } from "react";

export const CurrencyContext = createContext({
  currency: "TND",
  setCurrency: (currency: string) => {},
  exchangeRates: { TND: 1, USD: 0, EUR: 0 },
});

export const CurrencyProvider = ({ children }: { children: React.ReactNode }) => {
  const [currency, setCurrency] = useState("TND");
  const [exchangeRates, setExchangeRates] = useState({ TND: 1, USD: 0, EUR: 0 });

  useEffect(() => {
    // Fetch exchange rates from free API
    const fetchExchangeRates = async () => {
      try {
        const response = await fetch(
          "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/tnd.json"
        );
        const data = await response.json();
        (data)
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        setExchangeRates({
          TND: 1,
          USD: data.tnd.usd, 
          EUR: data.tnd.eur,
        });
      } catch (error) {
        console.error("Error fetching exchange rates:", error);
        // setExchangeRates({ TND: 1, USD: 0.32, EUR: 0.30 });
      }
    };
    fetchExchangeRates();
  }, []);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, exchangeRates }}>
      {children}
    </CurrencyContext.Provider>
  );
};