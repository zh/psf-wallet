import { useState, useEffect, useCallback } from 'react';
import { useAtom } from 'jotai';
import {
  walletAtom,
  walletConnectedAtom,
  tokensAtom,
  tokensRefreshTriggerAtom,
} from '../atoms';

const useTokensList = (interval = 5000) => {
  const [wallet] = useAtom(walletAtom);
  const [walletConnected] = useAtom(walletConnectedAtom);
  const [tokens, setTokens] = useAtom(tokensAtom);
  const [, triggerRefresh] = useAtom(tokensRefreshTriggerAtom);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Memoize the fetchTokens function to prevent unnecessary re-creations
  const fetchTokens = useCallback(async () => {
    if (!wallet || !walletConnected || !wallet.walletInfo?.cashAddress) {
      setTokens([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tokenList = await wallet.listTokens(); // Fetch tokens from the wallet
      setTokens(tokenList);
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
      setError(error.message || 'Get tokens list error occurred');
      setTokens([]);
    } finally {
      setLoading(false);
    }
  }, [wallet, walletConnected, setTokens]);

  useEffect(() => {
    if (walletConnected) {
      // Start fetching tokens immediately and set up the interval
      fetchTokens();
      const timer = setInterval(fetchTokens, interval);
      // Clear the interval on component unmount or when dependencies change
      return () => clearInterval(timer);
    }
  }, [walletConnected, fetchTokens, interval, triggerRefresh]);

  return { tokens, loading, error, refreshTokens: fetchTokens };
};

export default useTokensList;

