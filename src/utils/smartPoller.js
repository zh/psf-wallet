// src/utils/smartPoller.js

/**
 * Smart polling utility with exponential backoff and visibility detection
 * Optimizes API calls based on user activity and network conditions
 */

/**
 * Smart polling configuration
 */
const DEFAULT_CONFIG = {
  baseInterval: 10000,     // Base polling interval (10 seconds)
  maxInterval: 300000,     // Maximum interval (5 minutes)
  backoffMultiplier: 1.5,  // Multiplier for exponential backoff
  maxRetries: 3,           // Maximum consecutive failures before backing off
  visibilityPause: true,   // Pause when tab is not visible
  networkPause: true       // Pause when network is offline
};

/**
 * Smart poller class for optimized API polling
 */
export class SmartPoller {
  constructor(pollFunction, config = {}) {
    this.pollFunction = pollFunction;
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    this.isRunning = false;
    this.currentInterval = this.config.baseInterval;
    this.consecutiveFailures = 0;
    this.timeoutId = null;
    this.lastPollTime = 0;
    
    // Bind methods
    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this.poll = this.poll.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleOnlineChange = this.handleOnlineChange.bind(this);
    
    // Set up event listeners if in browser environment
    if (typeof window !== 'undefined') {
      this.setupEventListeners();
    }
  }

  /**
   * Set up browser event listeners for optimization
   */
  setupEventListeners() {
    if (this.config.visibilityPause) {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
    
    if (this.config.networkPause) {
      window.addEventListener('online', this.handleOnlineChange);
      window.addEventListener('offline', this.handleOnlineChange);
    }
  }

  /**
   * Clean up event listeners
   */
  cleanup() {
    if (typeof window !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      window.removeEventListener('online', this.handleOnlineChange);
      window.removeEventListener('offline', this.handleOnlineChange);
    }
  }

  /**
   * Handle tab visibility changes
   */
  handleVisibilityChange() {
    if (document.hidden) {
      this.pausePolling();
    } else {
      this.resumePolling();
    }
  }

  /**
   * Handle network connectivity changes
   */
  handleOnlineChange() {
    if (navigator.onLine) {
      this.resumePolling();
    } else {
      this.pausePolling();
    }
  }

  /**
   * Check if polling should be paused due to external conditions
   */
  shouldPause() {
    if (this.config.visibilityPause && document.hidden) {
      return true;
    }
    
    if (this.config.networkPause && !navigator.onLine) {
      return true;
    }
    
    return false;
  }

  /**
   * Start polling
   */
  start() {
    if (this.isRunning) {
      return;
    }
    
    this.isRunning = true;
    this.consecutiveFailures = 0;
    this.currentInterval = this.config.baseInterval;
    this.scheduleNextPoll();
  }

  /**
   * Stop polling
   */
  stop() {
    this.isRunning = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  /**
   * Pause polling temporarily
   */
  pausePolling() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  /**
   * Resume polling from pause
   */
  resumePolling() {
    if (this.isRunning && !this.timeoutId) {
      // If enough time has passed, poll immediately
      const timeSinceLastPoll = Date.now() - this.lastPollTime;
      if (timeSinceLastPoll >= this.currentInterval) {
        this.poll();
      } else {
        // Otherwise, schedule for the remaining time
        const remainingTime = this.currentInterval - timeSinceLastPoll;
        this.timeoutId = setTimeout(this.poll, Math.max(0, remainingTime));
      }
    }
  }

  /**
   * Execute the poll function and handle results
   */
  async poll() {
    if (!this.isRunning) {
      return;
    }

    // Check if we should pause
    if (this.shouldPause()) {
      this.scheduleNextPoll();
      return;
    }

    this.lastPollTime = Date.now();

    try {
      await this.pollFunction();
      
      // Success: reset failure count and interval
      this.consecutiveFailures = 0;
      this.currentInterval = this.config.baseInterval;
      
    } catch (error) {
      // Failure: increment counter and apply backoff
      this.consecutiveFailures++;
      
      if (this.consecutiveFailures >= this.config.maxRetries) {
        this.applyBackoff();
      }
      
      // Log error securely (avoid logging sensitive data)
      if (import.meta?.env?.DEV) {
        console.warn(`Smart poller failed (attempt ${this.consecutiveFailures}):`, 
          error.message || 'Unknown error');
      }
    }

    this.scheduleNextPoll();
  }

  /**
   * Apply exponential backoff after consecutive failures
   */
  applyBackoff() {
    this.currentInterval = Math.min(
      this.currentInterval * this.config.backoffMultiplier,
      this.config.maxInterval
    );
    
    if (import.meta?.env?.DEV) {
      console.info(`Smart poller backing off to ${this.currentInterval}ms interval`);
    }
  }

  /**
   * Schedule the next poll
   */
  scheduleNextPoll() {
    if (!this.isRunning) {
      return;
    }

    // Don't schedule if paused
    if (this.shouldPause()) {
      return;
    }

    this.timeoutId = setTimeout(this.poll, this.currentInterval);
  }

  /**
   * Get current polling status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      currentInterval: this.currentInterval,
      consecutiveFailures: this.consecutiveFailures,
      isPaused: this.shouldPause(),
      lastPollTime: this.lastPollTime
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    // Reset interval if it exceeds new maximum
    if (this.currentInterval > this.config.maxInterval) {
      this.currentInterval = this.config.maxInterval;
    }
  }
}

/**
 * Create a smart poller instance
 * @param {Function} pollFunction - Function to poll
 * @param {Object} config - Polling configuration
 * @returns {SmartPoller} Smart poller instance
 */
export const createSmartPoller = (pollFunction, config = {}) => {
  return new SmartPoller(pollFunction, config);
};

/**
 * Hook for React components to use smart polling
 * @returns {Object} Poller control and status
 */
export const useSmartPoller = () => {
  // This would be implemented in a React hook file
  // Keeping it here for reference but not implementing to avoid React import issues
  throw new Error('useSmartPoller should be implemented in a React hook file');
};

/**
 * Utility to create a batched polling function
 * Groups multiple poll requests together to reduce API calls
 * @param {Array} pollFunctions - Array of polling functions
 * @param {Object} config - Batching configuration
 * @returns {Function} Batched poll function
 */
export const createBatchedPoller = (pollFunctions, config = {}) => {
  const { batchDelay = 100, maxBatchSize = 10 } = config;
  
  return async () => {
    const batch = pollFunctions.slice(0, maxBatchSize);
    
    // Execute all polls in parallel with a small delay between batches
    const results = await Promise.allSettled(
      batch.map((pollFn, index) => 
        new Promise(resolve => 
          setTimeout(() => resolve(pollFn()), index * batchDelay)
        )
      )
    );
    
    // Log any failures in development
    if (import.meta?.env?.DEV) {
      const failures = results.filter(result => result.status === 'rejected');
      if (failures.length > 0) {
        console.warn(`Batch poller: ${failures.length} operations failed`);
      }
    }
    
    return results;
  };
};

/**
 * Adaptive polling that adjusts interval based on data freshness
 * @param {Function} pollFunction - Function to poll
 * @param {Function} dataComparator - Function to compare data freshness
 * @param {Object} config - Adaptive configuration
 * @returns {SmartPoller} Adaptive smart poller
 */
export const createAdaptivePoller = (pollFunction, dataComparator, config = {}) => {
  const adaptiveConfig = {
    ...config,
    fastInterval: config.fastInterval || 5000,    // Fast polling when data changes
    slowInterval: config.slowInterval || 60000,   // Slow polling when data is stable
    stabilityThreshold: config.stabilityThreshold || 3 // Polls without change before slowing
  };
  
  let unchangedPolls = 0;
  let lastData = null;
  
  const adaptivePollFunction = async () => {
    const result = await pollFunction();
    
    if (dataComparator && lastData !== null) {
      const hasChanged = !dataComparator(lastData, result);
      
      if (hasChanged) {
        unchangedPolls = 0;
        adaptiveConfig.baseInterval = adaptiveConfig.fastInterval;
      } else {
        unchangedPolls++;
        if (unchangedPolls >= adaptiveConfig.stabilityThreshold) {
          adaptiveConfig.baseInterval = adaptiveConfig.slowInterval;
        }
      }
    }
    
    lastData = result;
    return result;
  };
  
  return new SmartPoller(adaptivePollFunction, adaptiveConfig);
};

export default {
  SmartPoller,
  createSmartPoller,
  createBatchedPoller,
  createAdaptivePoller
};