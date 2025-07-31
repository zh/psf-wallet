import { useCallback, useEffect, useState, useMemo } from 'react';
import { useAtom } from 'jotai';
import { priceAtom } from '../atoms';
import { handleError, safeAsyncOperation } from '../utils/errorHandler';
import { useSmartPoller } from './useSmartPoller';

const useBchPrice = (refreshPrice = true, refreshInterval = 10000) => {
  const [price, setPrice] = useAtom(priceAtom);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPrice = useCallback(async () => {
    if (!refreshPrice) return;

    setLoading(true);
    setError(null);

    try {
      const result = await safeAsyncOperation(
        async () => {
          const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BCHUSDT');
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          const data = await response.json();
          const newPrice = parseFloat(data.price);
          if (isNaN(newPrice) || newPrice <= 0) {
            throw new Error('Invalid price data received');
          }
          return newPrice;
        },
        'fetchBchPrice'
      );

      if (price !== result) {
        setPrice(result);
      }
      setError(null);
    } catch (err) {
      const handledError = handleError(err, 'price_fetch');
      setError(handledError.message);
    } finally {
      setLoading(false);
    }
  }, [refreshPrice, price, setPrice]);

  // Smart poller configuration for price fetching
  const pollerConfig = useMemo(() => ({
    baseInterval: refreshInterval,
    maxInterval: 300000, // 5 minutes max
    backoffMultiplier: 1.5,
    maxRetries: 3,
    visibilityPause: true,
    networkPause: true
  }), [refreshInterval]);

  // Use smart poller for optimized price fetching
  useSmartPoller(
    fetchPrice,
    pollerConfig,
    [refreshPrice]
  );

  // Initial fetch
  useEffect(() => {
    if (refreshPrice) {
      fetchPrice();
    }
  }, [refreshPrice, fetchPrice]);

  return { price, loading, error };
};

export default useBchPrice;

