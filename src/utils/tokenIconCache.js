// Token icon cache to avoid repeated requests and improve performance
class TokenIconCache {
  constructor() {
    this.cache = new Map();
    this.failedTokens = new Set();
    this.loadAttempts = new Map();
    this.loadingTokens = new Set(); // Track tokens currently being loaded
    this.gatewayHealth = new Map(); // Track gateway success rates
    this.maxAttempts = 1; // Single attempt to avoid overwhelming gateways
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours cache expiry
  }

  // Check if we should attempt to load this token (with debouncing)
  shouldAttemptLoad(tokenId) {
    // Don't attempt if already cached, failed, or currently loading
    if (this.cache.has(tokenId) || this.failedTokens.has(tokenId) || this.loadingTokens.has(tokenId)) {
      return false;
    }

    const attempts = this.loadAttempts.get(tokenId) || 0;
    const lastAttempt = this.getLastAttemptTime(tokenId);
    const now = Date.now();

    // Debounce: wait at least 5 seconds between attempts
    if (lastAttempt && (now - lastAttempt) < 5000) {
      return false;
    }

    return attempts < this.maxAttempts;
  }

  // Track last attempt time for debouncing
  getLastAttemptTime(tokenId) {
    return this.loadAttempts.get(`${tokenId}_time`);
  }

  setLastAttemptTime(tokenId) {
    this.loadAttempts.set(`${tokenId}_time`, Date.now());
  }

  // Mark token as currently loading
  startLoading(tokenId) {
    this.loadingTokens.add(tokenId);
    this.setLastAttemptTime(tokenId);
    const attempts = this.loadAttempts.get(tokenId) || 0;
    this.loadAttempts.set(tokenId, attempts + 1);
  }

  // Mark token as no longer loading
  stopLoading(tokenId) {
    this.loadingTokens.delete(tokenId);
  }

  // Record a failed attempt with error type tracking
  recordFailure(tokenId, errorType = 'unknown') {
    this.stopLoading(tokenId);
    this.failedTokens.add(tokenId);

    const attempts = (this.loadAttempts.get(tokenId) || 0) + 1;
    this.loadAttempts.set(tokenId, attempts);

    // Track error types for debugging (without console spam)
    if (!this.errorTypes) {
      this.errorTypes = new Map();
    }

    const currentCount = this.errorTypes.get(errorType) || 0;
    this.errorTypes.set(errorType, currentCount + 1);
  }

  // Record successful load with timestamp
  recordSuccess(tokenId, iconData) {
    this.stopLoading(tokenId);
    const cacheEntry = {
      ...iconData,
      timestamp: Date.now()
    };
    this.cache.set(tokenId, cacheEntry);
  }

  // Record gateway performance for health tracking
  recordGatewayPerformance(gateway, success, responseTime) {
    if (!this.gatewayHealth.has(gateway)) {
      this.gatewayHealth.set(gateway, {
        successCount: 0,
        failureCount: 0,
        totalResponseTime: 0,
        requestCount: 0
      });
    }

    const health = this.gatewayHealth.get(gateway);
    health.requestCount++;
    health.totalResponseTime += responseTime;

    if (success) {
      health.successCount++;
    } else {
      health.failureCount++;
    }
  }

  // Get cached result, checking expiry
  get(tokenId) {
    const cacheEntry = this.cache.get(tokenId);
    if (!cacheEntry) return null;

    // Check if cache entry is expired
    if (Date.now() - cacheEntry.timestamp > this.cacheExpiry) {
      this.cache.delete(tokenId);
      return null;
    }

    return cacheEntry;
  }

  // Set cached result with timestamp
  set(tokenId, iconData) {
    const cacheEntry = {
      ...iconData,
      timestamp: Date.now()
    };
    this.cache.set(tokenId, cacheEntry);
  }

  // Check if token is cached and not expired
  has(tokenId) {
    const cacheEntry = this.cache.get(tokenId);
    if (!cacheEntry) return false;

    // Check expiry
    if (Date.now() - cacheEntry.timestamp > this.cacheExpiry) {
      this.cache.delete(tokenId);
      return false;
    }

    return true;
  }

  // Check if token is permanently failed
  isFailed(tokenId) {
    return this.failedTokens.has(tokenId);
  }

  // Get gateway health statistics
  getGatewayHealth(gateway) {
    const health = this.gatewayHealth.get(gateway);
    if (!health) return null;

    return {
      successRate: health.successCount / health.requestCount,
      averageResponseTime: health.totalResponseTime / health.requestCount,
      requestCount: health.requestCount
    };
  }

  // Get best performing gateways
  getBestGateways() {
    const gateways = Array.from(this.gatewayHealth.entries())
      .map(([gateway, health]) => ({
        gateway,
        successRate: health.successCount / health.requestCount,
        averageResponseTime: health.totalResponseTime / health.requestCount,
        requestCount: health.requestCount
      }))
      .filter(g => g.requestCount >= 3) // Only consider gateways with enough samples
      .sort((a, b) => {
        // Sort by success rate first, then by response time
        if (Math.abs(a.successRate - b.successRate) < 0.1) {
          return a.averageResponseTime - b.averageResponseTime;
        }
        return b.successRate - a.successRate;
      });

    return gateways;
  }

  // Clear expired entries
  cleanup() {
    const now = Date.now();
    for (const [tokenId, cacheEntry] of this.cache.entries()) {
      if (now - cacheEntry.timestamp > this.cacheExpiry) {
        this.cache.delete(tokenId);
      }
    }
  }

  // Clear all cache (for debugging)
  clear() {
    this.cache.clear();
    this.failedTokens.clear();
    this.loadAttempts.clear();
    this.loadingTokens.clear();
    this.gatewayHealth.clear();
    if (this.errorTypes) {
      this.errorTypes.clear();
    }
  }

  // Get comprehensive cache statistics
  getStats() {
    const errorTypes = this.errorTypes ? Object.fromEntries(this.errorTypes) : {};

    return {
      cached: this.cache.size,
      failed: this.failedTokens.size,
      loading: this.loadingTokens.size,
      totalAttempts: Array.from(this.loadAttempts.values()).reduce((sum, attempts) => sum + attempts, 0),
      gatewayCount: this.gatewayHealth.size,
      errorTypes
    };
  }
}

// Global instance
const tokenIconCache = new TokenIconCache();

// Cleanup expired entries every hour
setInterval(() => {
  tokenIconCache.cleanup();
}, 60 * 60 * 1000);

export default tokenIconCache;