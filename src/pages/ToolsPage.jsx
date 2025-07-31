import { useState, useEffect } from 'react';
import MobileLayout from '../components/Layout/MobileLayout';
import Sweeper from '../components/Sweeper';
import WalletDetails from '../components/WalletDetails';
import { useAtom } from 'jotai';
import { optionsAtom, walletAtom, walletConnectedAtom, notificationAtom } from '../atoms';
import { getCacheStats, clearAllCaches } from '../utils/cache';
import '../styles/settings.css';
import '../styles/tools.css';

const ToolsPage = () => {
  const [showWalletDetails, setShowWalletDetails] = useState(false);
  const [options, setOptions] = useAtom(optionsAtom);
  const [walletConnected] = useAtom(walletConnectedAtom);
  const [wallet] = useAtom(walletAtom);
  const [, setNotification] = useAtom(notificationAtom);
  const [cacheStats, setCacheStats] = useState(null);

  useEffect(() => {
    setCacheStats(getCacheStats());
  }, []);

  const updateRestURL = async (url) => {
    try {
      // Update the options first
      setOptions((prevOptions) => ({ ...prevOptions, restURL: url }));
      
      // If wallet is connected, update its server endpoint without disconnecting
      if (walletConnected && wallet) {
        // Update the wallet's REST URL directly
        if (wallet.bchjs && wallet.bchjs.restURL) {
          wallet.bchjs.restURL = url;
        }
        
        // If the wallet has an options property, update it
        if (wallet.options) {
          wallet.options.restURL = url;
        }
        
        console.log('Server switched successfully! Wallet remains connected.');
      }
    } catch (error) {
      alert(`Error switching server: ${error.message}`);
      console.error('Server switch error:', error);
    }
  };

  const handleClearCache = () => {
    if (window.confirm('Clear all cached data? This will require fresh network requests.')) {
      const clearedCount = clearAllCaches();

      // Refresh cache stats immediately
      const newStats = getCacheStats();
      setCacheStats(newStats);

      // Show feedback to user
      const message = clearedCount > 0
        ? `Successfully cleared ${clearedCount} cache items`
        : 'No cache items found to clear';

      setNotification({
        type: 'success',
        message: message
      });
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <MobileLayout title="Tools">
      <div className="tools-content">
        {/* 1. Wallet Details - Collapsible */}
        <div className="tool-section">
          <div className="section-header">
            <h2>Wallet Details</h2>
            <button
              onClick={() => setShowWalletDetails(!showWalletDetails)}
              className="toggle-button"
            >
              {showWalletDetails ? '−' : '+'}
            </button>
          </div>
          {showWalletDetails && (
            <div className="section-content">
              <WalletDetails />
            </div>
          )}
        </div>

        {/* 2. Server Configuration - Always Visible */}
        <div className="tool-section">
          <div className="section-header">
            <h2>Server Configuration</h2>
          </div>
          <div className="section-content">
            <select
              id="rest-url-select"
              value={options.restURL}
              onChange={(e) => updateRestURL(e.target.value)}
              className="server-select"
            >
              <option value="" disabled>
                -- Select a server --
              </option>
              <option value="https://free-bch.fullstack.cash">FullStack.cash (Free)</option>
              <option value="https://dev-consumer.psfoundation.info">
                PSF Development
              </option>
              <option value="https://cashstack.tokentiger.com">
                TokenTiger CashStack
              </option>
            </select>
            {walletConnected && (
              <p className="server-note">
                ⚠️ Changing server will disconnect and reconnect your wallet
              </p>
            )}
          </div>
        </div>

        {/* 3. Cache Management - Always Visible */}
        <div className="tool-section">
          <div className="section-header">
            <h2>Cache Management</h2>
          </div>
          <div className="section-content">
            {cacheStats && (
              <div className="cache-stats">
                <div className="cache-stat-item">
                  <strong>Cache Size:</strong> {formatBytes(cacheStats.totalSize)}
                </div>
                <div className="cache-stat-item">
                  <strong>Cached Items:</strong> {cacheStats.itemCount === 0 ? '0 (no cached data)' : cacheStats.itemCount}
                </div>
                <div className="cache-description">
                  Cached data helps reduce network usage when offline
                </div>
                <button
                  onClick={() => setCacheStats(getCacheStats())}
                  className="refresh-stats-button"
                >
                  Refresh Stats
                </button>
              </div>
            )}
            <button 
              onClick={handleClearCache} 
              className="cache-clear-button"
              disabled={cacheStats && cacheStats.itemCount === 0}
            >
              {cacheStats && cacheStats.itemCount === 0 ? 'No Cache to Clear' : 'Clear All Cache'}
            </button>
          </div>
        </div>

        {/* 4. Sweep Wallet - Always Visible */}
        <div className="tool-section">
          <div className="section-header">
            <h2>Sweep Wallet</h2>
          </div>
          <div className="section-content">
            <Sweeper />
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default ToolsPage;