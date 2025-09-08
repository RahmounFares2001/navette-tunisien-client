import { useState, useContext } from "react";
import { useTranslation } from "react-i18next";
import { CurrencyContext } from "./CurrencyContext";

const currencies = [
  { code: "TND", label: "TND", symbol: "TND" },
  { code: "USD", label: "USD", symbol: "USD" },
  { code: "EUR", label: "EUR", symbol: "EUR" },
];

const CurrencySwitcher = () => {
  const { t } = useTranslation();
  const { currency, setCurrency } = useContext(CurrencyContext);
  const [isOpen, setIsOpen] = useState(false);

  const changeCurrency = (code: string) => {
    setCurrency(code);
    setIsOpen(false);
  };

  const currentCurrency = currencies.find((c) => c.code === currency) || currencies[0];

  return (
    <div className="relative inline-block text-left">
      {/* Mobile view: Three buttons in a row */}
      {/* <div className="flex md:hidden gap-2">
        {currencies.map((curr) => (
          <button
            key={curr.code}
            onClick={() => changeCurrency(curr.code)}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md shadow-sm border border-gray-300 transition-colors ${
              currency === curr.code
                ? 'bg-green-700 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {curr.label}
          </button>
        ))}
      </div> */}

      {/* Desktop view: Dropdown */}
      <div className="">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex justify-center items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium rounded-md shadow-sm hover:bg-gray-50"
        >
          {currentCurrency.symbol}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-36 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
            <div className="py-1">
              {currencies.map((curr) => (
                <button
                  key={curr.code}
                  onClick={() => changeCurrency(curr.code)}
                  className={`block w-full px-4 py-2 text-left text-sm ${
                    currency === curr.code
                      ? 'bg-orange-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {curr.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrencySwitcher;