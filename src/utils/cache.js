/**
 * Utility functions for caching wallet data in localStorage
 */

const CACHE_KEYS = {
  BALANCE: 'wallet-balance-cache',
  SETTINGS: 'wallet-settings',
  UTXOS: 'wallet-utxos-cache'
};

const CACHE_EXPIRY = {
  BALANCE: 5 * 60 * 1000, // 5 minutes
  UTXOS: 15 * 60 * 1000 // 15 minutes
};

/**
 * Set cached data with timestamp
 */
export const setCachedData = (key, data) => {
  try {
    const cacheItem = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(cacheItem));
  } catch (error) {
    console.warn('Failed to cache data:', error);
  }
};

/**
 * Get cached data if not expired
 */
export const getCachedData = (key, maxAge = null) => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const cacheItem = JSON.parse(cached);
    const age = Date.now() - cacheItem.timestamp;

    if (maxAge && age > maxAge) {
      localStorage.removeItem(key);
      return null;
    }

    return {
      data: cacheItem.data,
      timestamp: cacheItem.timestamp,
      age,
      isStale: maxAge ? age > maxAge : false
    };
  } catch (error) {
    console.warn('Failed to get cached data:', error);
    return null;
  }
};

/**
 * Clear specific cache
 */
export const clearCache = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Failed to clear cache:', error);
  }
};

/**
 * Clear all wallet caches
 */
export const clearAllCaches = () => {
  try {
    // Get all localStorage keys
    const keysToRemove = [];

    // Find all keys that start with any of our cache key prefixes
    Object.values(CACHE_KEYS).forEach(baseKey => {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(baseKey)) {
          keysToRemove.push(key);
        }
      });
    });

    // Also clear other wallet-related keys
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('wallet-') ||
          key.startsWith('psf-') ||
          key.includes('cache')) {
        keysToRemove.push(key);
      }
    });

    // Remove all found keys
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    console.log(`Cleared ${keysToRemove.length} cache items:`, keysToRemove);
    return keysToRemove.length;
  } catch (error) {
    console.error('Failed to clear all caches:', error);
    return 0;
  }
};

/**
 * Cache balance data
 */
export const setCachedBalance = (address, balance) => {
  setCachedData(`${CACHE_KEYS.BALANCE}-${address}`, balance);
};

/**
 * Get cached balance data
 */
export const getCachedBalance = (address) => {
  return getCachedData(`${CACHE_KEYS.BALANCE}-${address}`, CACHE_EXPIRY.BALANCE);
};


/**
 * Cache UTXO data
 */
export const setCachedUTXOs = (address, utxos) => {
  setCachedData(`${CACHE_KEYS.UTXOS}-${address}`, utxos);
};

/**
 * Get cached UTXO data
 */
export const getCachedUTXOs = (address) => {
  return getCachedData(`${CACHE_KEYS.UTXOS}-${address}`, CACHE_EXPIRY.UTXOS);
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  const stats = {
    totalSize: 0,
    itemCount: 0,
    items: []
  };

  Object.values(CACHE_KEYS).forEach(baseKey => {
    try {
      // Check for address-specific keys
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(baseKey)) {
          const value = localStorage.getItem(key);
          if (value) {
            const size = new Blob([value]).size;
            stats.totalSize += size;
            stats.itemCount++;
            stats.items.push({
              key,
              size,
              age: Date.now() - (JSON.parse(value).timestamp || 0)
            });
          }
        }
      });
    } catch (error) {
      console.warn('Error calculating cache stats:', error);
    }
  });

  return stats;
};