import { useState } from 'react';
import PropTypes from 'prop-types';
import { useAtom, useSetAtom } from 'jotai';
import {
  balanceAtom,
  busyAtom,
  walletAtom,
  mnemonicAtom,
  optionsAtom,
  notificationAtom,
} from '../atoms';
import { useConnectWallet } from '../hooks';
import Address from './Address';
import Balance from './Balance';
import SendBCH from './SendBCH';
import Sweeper from './Sweeper';
import WalletDetails from './WalletDetails';

const Wallet = ({ showOptimize = false, showSLP = false }) => {
  const { connectWallet, disconnectWallet, walletConnected } = useConnectWallet();
  const [wallet] = useAtom(walletAtom); // Ensure walletAtom is used here
  const [,setBalance] = useAtom(balanceAtom);
  const [mnemonic] = useAtom(mnemonicAtom);
  const [options] = useAtom(optionsAtom);
  const [busy, setBusy] = useAtom(busyAtom);
  const setNotification = useSetAtom(notificationAtom);
  const [showDetails, setShowDetails] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Enable connect button only if mnemonic is not empty and an option is selected
  const isConnectEnabled = mnemonic.trim() && options.restURL;

  const handleConnect = async () => {
    try {
      setConnecting(true);
      await connectWallet();
      setNotification({ type: 'success', message: 'Wallet connected!'});
    } catch (error) {
      setNotification({ type: 'error', message: `Failed to connect wallet: ${error}`});
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setBalance(0);
    setNotification({ type: 'success', message: 'Wallet disconnected!'});
  };

  const handleOptimize = async () => {
    if (!wallet) return;

    try {
      setBusy(true)
      await wallet.optimize();
      const bchUtxos = wallet.utxos.utxoStore.bchUtxos
      const utxoCount = bchUtxos.length;
      console.log(`UTXO count: ${utxoCount}`);
      if (utxoCount > 10) {
        setNotification({ type: 'warning', message: 'Still has more than 10 UTXOs.'});
      } else {
        setNotification({ type: 'success', message: 'Wallet optimized!'});
      }
    } catch (error) {
      setNotification({ type: 'error', message: `Failed to optimize wallet: ${error}`});
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`wallet-container ${walletConnected ? 'connected' : ''}`}>
      {walletConnected ? (
        <>
          <div className="wallet-info">
            <div className="container address-container">
              <fieldset className="form-group">
                <legend>[ Receive ]</legend>
                <Address addressFormat={'long'} showSLP={showSLP} />
              </fieldset>
            </div>
            <div className="container balance-container">
              <fieldset className="form-group">
                <legend>[ Balance ]</legend>
                <Balance />
              </fieldset>
            </div>
            <Sweeper />
            <SendBCH />
            <button
              onClick={() => setShowDetails((prev) => !prev)}
              className="toggle-details-button"
            >
              {showDetails ? 'Less Info' : 'More Info'}
            </button>
            {showDetails && <WalletDetails />}
            <div className="form-input-group">
            <button
              disabled={busy}
              onClick={handleDisconnect}
              className="wallet-button disconnect"
            >
              Disconnect
            </button>
            {showOptimize && <button
              disabled={busy}
              onClick={() => handleOptimize()}
              className="wallet-button optimize"
            >
              Optimize
            </button>}
            </div>
          </div>
        </>
      ) : (
        <div className="wallet-info">
        {connecting && <small className="connecting-info">connecting...</small>}
        <button
          onClick={handleConnect}
          className="wallet-button connect"
          disabled={connecting || !connectWallet || !isConnectEnabled}
        >
          Connect
        </button>
        </div>
      )}
    </div>
  );
};

Wallet.propTypes = {
  showOptimize: PropTypes.bool, // Whether to display 'Optimize' button
  showSLP: PropTypes.bool, // Whether to display SLP address
};

export default Wallet;
