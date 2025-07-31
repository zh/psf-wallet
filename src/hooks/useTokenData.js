import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAtom } from 'jotai';
import { walletAtom, walletConnectedAtom } from '../atoms';

const useTokenData = (tokenId) => {
  const [wallet] = useAtom(walletAtom);
  const [walletConnected] = useAtom(walletConnectedAtom);
  const [tokenData, setTokenData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTokenData = useCallback(async () => {
    if (!wallet || !walletConnected || !tokenId) return;

    setLoading(true);
    try {
      const data = await wallet.getTokenData(tokenId);
      setTokenData(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [wallet, walletConnected, tokenId]);

  useEffect(() => {
    fetchTokenData();
  }, [fetchTokenData]);

  return { tokenData, loading, error };
};

useTokenData.propTypes = {
  tokenId: PropTypes.string.isRequired,
};

export default useTokenData;

