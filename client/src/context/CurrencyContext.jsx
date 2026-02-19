import { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('USD');
  const [exchangeRates, setExchangeRates] = useState({});

  const currencyOptions = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
  ];

  useEffect(() => {
    // Use static rates to avoid API calls during development
    setExchangeRates({
      USD: 1,
      EUR: 0.85,
      GBP: 0.73,
    });
  }, []);

  const formatPrice = (price) => {
    const currencyObj = currencyOptions.find(c => c.code === currency);
    const symbol = currencyObj?.symbol || '$';
    return `${symbol}${price.toFixed(2)}`;
  };

  const getNumericPrice = (priceString) => {
    if (!priceString) return 0;
    const numericString = priceString.replace(/[^\d.]/g, '');
    return parseFloat(numericString) || 0;
  };

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency,
      currencyOptions,
      formatPrice,
      getNumericPrice
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};