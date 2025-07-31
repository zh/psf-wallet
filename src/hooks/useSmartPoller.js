// src/hooks/useSmartPoller.js
import { useEffect, useRef, useCallback } from 'react';
import { createSmartPoller } from '../utils/smartPoller';

/**
 * React hook for smart polling with optimization features
 * @param {Function} pollFunction - Function to poll
 * @param {Object} config - Polling configuration
 * @param {Array} dependencies - Dependencies for effect
 * @returns {Object} Poller control and status
 */
export const useSmartPoller = (pollFunction, config = {}, dependencies = []) => {
  const pollerRef = useRef(null);
  const configRef = useRef(config);
  
  // Update config reference when it changes
  configRef.current = config;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedPollFunction = useCallback(pollFunction, dependencies);

  useEffect(() => {
    // Create poller instance
    pollerRef.current = createSmartPoller(memoizedPollFunction, configRef.current);
    
    // Start polling
    pollerRef.current.start();

    // Cleanup on unmount
    return () => {
      if (pollerRef.current) {
        pollerRef.current.stop();
        pollerRef.current.cleanup();
        pollerRef.current = null;
      }
    };
  }, [memoizedPollFunction]);

  // Update config if it changes
  useEffect(() => {
    if (pollerRef.current) {
      pollerRef.current.updateConfig(configRef.current);
    }
  }, [config]);

  const start = useCallback(() => {
    if (pollerRef.current) {
      pollerRef.current.start();
    }
  }, []);

  const stop = useCallback(() => {
    if (pollerRef.current) {
      pollerRef.current.stop();
    }
  }, []);

  const getStatus = useCallback(() => {
    return pollerRef.current ? pollerRef.current.getStatus() : null;
  }, []);

  return {
    start,
    stop,
    getStatus,
    isActive: pollerRef.current?.isRunning || false
  };
};

export default useSmartPoller;