import { useState } from 'react';
import MobileLayout from '../components/Layout/MobileLayout';
import Sweeper from '../components/Sweeper';
import WalletDetails from '../components/WalletDetails';
import { useAtom } from 'jotai';
import { optionsAtom, walletAtom, walletConnectedAtom } from '../atoms';
import '../styles/settings.css';
import '../styles/tools.css';

const ToolsPage = () => {
  const [showWalletDetails, setShowWalletDetails] = useState(false);
  const [options, setOptions] = useAtom(optionsAtom);
  const [walletConnected] = useAtom(walletConnectedAtom);
  const [wallet] = useAtom(walletAtom);

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

        {/* 3. Sweep Wallet - Always Visible */}
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