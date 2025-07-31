import { useState, useEffect, useCallback } from 'react';
import { useAtom } from 'jotai';
import {
  walletAtom,
  walletConnectedAtom,
  balanceAtom,
  balanceRefreshTriggerAtom,
} from '../atoms';
import { handleError, safeAsyncOperation } from '../utils/errorHandler';

const useBalance = () => {
  const [wallet] = useAtom(walletAtom);
  const [walletConnected] = useAtom(walletConnectedAtom);
  const [balance, setBalance] = useAtom(balanceAtom);
  const [triggerRefresh] = useAtom(balanceRefreshTriggerAtom);
  const [satsBalance, setSatsBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Memoize fetchBalance to avoid creating a new function on each render
  const fetchBalance = useCallback(async () => {
    if (!wallet || !walletConnected || !wallet.walletInfo?.cashAddress) {
      setBalance(0); // Reset to 0 if wallet is not available
      setSatsBalance(0);
      setLoading(false); // Ensure loading is false when wallet is not available
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Direct call to wallet.getBalance - no safeAsyncOperation wrapper
      const sats = await wallet.getBalance(wallet.walletInfo.cashAddress);
      const bchBalance = wallet.bchjs.BitcoinCash.toBitcoinCash(sats);
      console.log('✅ Balance fetch successful:', { sats, bchBalance });

      setSatsBalance(sats);
      setBalance(bchBalance);
      setError(null);
    } catch (error) {
      const handledError = handleError(error, 'balance_fetch');
      console.log('❌ Balance fetch failed:', handledError);
      setError(handledError.message);
      setBalance(0);
      setSatsBalance(0);
    } finally {
      setLoading(false);
    }
  }, [wallet, walletConnected, setBalance]);

  // No automatic polling - manual refresh only

  // Initial fetch when wallet connects or trigger changes
  useEffect(() => {
    if (walletConnected && wallet) {
      fetchBalance();
    }
  }, [walletConnected, wallet, triggerRefresh, fetchBalance]);


  return { balance, satsBalance, loading, error };
};

export default useBalance;

