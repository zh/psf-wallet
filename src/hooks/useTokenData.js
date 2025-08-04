import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAtom } from 'jotai';
import { walletAtom, walletConnectedAtom } from '../atoms';
import SlpTokenData from '../utils/slp-token-data';
import tokenIconCache from '../utils/tokenIconCache';

const useTokenData = (token) => {
  const [wallet] = useAtom(walletAtom);
  const [walletConnected] = useAtom(walletConnectedAtom);
  const [tokenData, setTokenData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isValidURL = (string) => {
    try {
      new URL(string);
      return true; // If no error is thrown, it's a valid URL
    } catch {
      return false; // Invalid URL
    }
  };

  const fetchTokenData = useCallback(async () => {
    if (!wallet || !walletConnected || !token || !token.tokenId) return;

    const tokenId = token.tokenId;

    // Check cache first for icon data
    if (tokenIconCache.has(tokenId)) {
      const cachedData = tokenIconCache.get(tokenId);
      setTokenData(cachedData);
      setLoading(false);
      return;
    }

    // If token is permanently failed, use default immediately
    if (tokenIconCache.isFailed(tokenId)) {
      const defaultData = { icon: '/token-placeholder.svg', download: true };
      setTokenData(defaultData);
      setLoading(false);
      return;
    }

    // Check if we should attempt loading
    if (!tokenIconCache.shouldAttemptLoad(tokenId)) {
      const defaultData = { icon: '/token-placeholder.svg', download: true };
      setTokenData(defaultData);
      setLoading(false);
      return;
    }

    // Mark as loading to prevent concurrent requests
    tokenIconCache.startLoading(tokenId);
    setLoading(true);
    setError(null);

    try {
      let data = null;
      let tokenUrl = token.url;

      // Handle different URL formats - only safe ones
      if (token.url) {
        if (
          token.url.startsWith('ipfs:') ||
          token.url.startsWith('nouns:') ||
          token.url.startsWith('pouns:')
        ) {
          tokenUrl = token.url;
        } else if (token.url.startsWith('Qm') || token.url.startsWith('bafyb')) {
          tokenUrl = `ipfs://${token.url}`;
        } else {
          // Pass document URL as-is to let getMedia detect IPFS hashes
          tokenUrl = token.url;
        }
      }

      // Try safe URLs first (IPFS, PSF, generated content)
      if (tokenUrl && isValidURL(tokenUrl) && !tokenUrl.includes('bch.sx')) {
        try {
          data = await SlpTokenData.getMedia(tokenUrl, { token, wallet, size: 64, timeout: 3000 });
        } catch {
          data = null;
        }
      }

      // Try alternative sources if safe URL failed
      if (!data || !data.icon) {
        // First try generated/computed icons (Nouns, Pouns)
        try {
          if (token.url && (
            token.url.startsWith('nouns:') ||
            token.url.startsWith('pouns:')
          )) {
            data = await SlpTokenData.getMedia(token.url, { token, wallet, size: 64, timeout: 3000 });
          }
        } catch {
          // Generation failed, continue to alternatives
        }
      }

      // Try alternative data sources (SLPDB, GitHub, etc.) as final attempt
      if (!data || !data.icon) {
        try {
          data = await SlpTokenData.getMedia('alternatives://', { token, wallet, size: 128, timeout: 5000 });
        } catch {
          // Alternative sources failed, will use default
        }
      }

      // Final result handling
      if (!data || !data.icon) {
        data = { icon: '/token-placeholder.svg', download: true };
        tokenIconCache.recordFailure(tokenId);
      } else {
        tokenIconCache.recordSuccess(tokenId, data);
      }

      setTokenData(data);

    } catch (err) {
      // Silent error handling to avoid console spam from Chrome extension issues
      const errorType = err.name === 'TypeError' && err.message.includes('CORS') ? 'cors' : 'network';
      tokenIconCache.recordFailure(tokenId, errorType);

      // Set fallback icon on error
      const defaultData = { icon: '/token-placeholder.svg', download: true };
      setTokenData(defaultData);
    } finally {
      setLoading(false);
    }
  }, [wallet, walletConnected, token]);

  useEffect(() => {
    if (walletConnected && wallet && token && token.tokenId) {
      // Only fetch if not already cached or failed
      const tokenId = token.tokenId;
      if (!tokenIconCache.has(tokenId) && !tokenIconCache.isFailed(tokenId)) {
        fetchTokenData();
      } else {
        // Use cached data immediately
        if (tokenIconCache.has(tokenId)) {
          setTokenData(tokenIconCache.get(tokenId));
        } else {
          setTokenData({ icon: '/token-placeholder.svg', download: true });
        }
        setLoading(false);
      }
    }
  }, [walletConnected, wallet, token, fetchTokenData]);

  return {
    tokenData,
    loading,
    error,
    cacheStats: tokenIconCache.getStats()
  };
};

useTokenData.propTypes = {
  token: PropTypes.shape({
    tokenId: PropTypes.string.isRequired,
    name: PropTypes.string,
    ticker: PropTypes.string,
    qty: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    url: PropTypes.string,
  }),
};

export default useTokenData;

