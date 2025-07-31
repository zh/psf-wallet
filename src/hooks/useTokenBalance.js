import { useState, useEffect, useCallback } from 'react';
import { useAtom } from 'jotai';
import {
  walletAtom,
  walletConnectedAtom
} from '../atoms';

const useTokenBalance = (tokenId, refreshInterval = 10000) => {
  const [wallet] = useAtom(walletAtom);
  const [walletConnected] = useAtom(walletConnectedAtom);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Memoize fetchBalance to avoid creating a new function on each render
  const fetchTokenBalance = useCallback(async () => {
    if (!wallet || !walletConnected || !tokenId) {
      setError('Wallet or token ID not provided.');
      return;
    }

    setLoading(true);

    try {
      let token = null;
      const tokens = await wallet.listTokens();
      if (tokens) {
        tokens.forEach((t) => {
          if (t.tokenId === tokenId) {
            token = t;
          }
        });
      }
      if (!token) {
        setLoading(false);
        setBalance(0);
        return;
      }

      setBalance(token.qty);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch token balance:', error);
      setError(error.message || 'An error occurred');
      setBalance(0); // Reset to 0 in case of an error
    } finally {
     setLoading(false);
    }
  }, [wallet, walletConnected, tokenId]);

  useEffect(() => {
    if (walletConnected && wallet && tokenId) {
      fetchTokenBalance(); // Fetch balance when wallet connects
      const interval = setInterval(fetchTokenBalance, refreshInterval);
      return () => clearInterval(interval); // Cleanup interval on unmount or disconnect
    }
  }, [walletConnected, wallet, tokenId, fetchTokenBalance, refreshInterval]);


  return { balance, loading, error, refreshBalance: fetchTokenBalance };
};

export default useTokenBalance;

