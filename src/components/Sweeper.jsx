// src/components/Sweeper.jsx
import { useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import Sweep from 'bch-token-sweep';
import { notificationAtom, busyAtom, walletAtom, walletConnectedAtom } from '../atoms';
import QrCodeScanner from './QrCodeScanner';
import { isValidWIF, sanitizeInput } from '../utils/validation';

const Sweeper = () => {
  const [wallet] = useAtom(walletAtom);
  const [walletConnected] = useAtom(walletConnectedAtom);
  const [busy, setBusy] = useAtom(busyAtom);
  const setNotification = useSetAtom(notificationAtom);
  
  // State management
  const [sweepKey, setSweepKey] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [phase, setPhase] = useState('input'); // 'input', 'checking', 'confirm', 'sweeping'
  const [paperWalletInfo, setPaperWalletInfo] = useState(null);
  const [validationError, setValidationError] = useState('');

  // Handle QR code scan result
  const handleAddressDetected = (scannedData) => {
    if (!walletConnected) {
      setNotification({ type: 'error', message: 'Wallet is not connected.' });
      return;
    }

    try {
      let key = '';
      
      if (Array.isArray(scannedData) && scannedData.length > 0) {
        key = scannedData[0].rawValue || scannedData[0].text || scannedData[0];
      } else if (typeof scannedData === 'string') {
        key = scannedData;
      } else if (scannedData && (scannedData.rawValue || scannedData.text)) {
        key = scannedData.rawValue || scannedData.text;
      }

      if (key && typeof key === 'string') {
        const sanitizedKey = sanitizeInput(key.trim(), 'wif');
        setSweepKey(sanitizedKey);
        validateWIF(sanitizedKey);
        setNotification({ type: 'success', message: 'Private key scanned successfully!' });
      } else {
        setNotification({ type: 'error', message: 'Could not extract private key from QR code.' });
      }
    } catch (error) {
      console.error('Error processing scanned data:', error);
      setNotification({ type: 'error', message: 'Error processing QR code data.' });
    }
    
    setShowScanner(false);
  };

  // Real-time WIF validation
  const validateWIF = (wif) => {
    if (!wif) {
      setValidationError('');
      return false;
    }

    if (!isValidWIF(wif)) {
      setValidationError('Invalid WIF format. Must start with L, K, or 5');
      return false;
    }

    setValidationError('');
    return true;
  };

  // Handle input change with validation
  const handleInputChange = (value) => {
    const sanitized = sanitizeInput(value, 'wif');
    setSweepKey(sanitized);
    validateWIF(sanitized);
  };

  // Check paper wallet balance before sweep
  const checkPaperWallet = async () => {
    if (!validateWIF(sweepKey)) return;

    try {
      setPhase('checking');
      setBusy(true);
      setNotification({ type: 'info', message: 'Checking paper wallet balance...' });

      // Create temporary wallet from WIF to check balance
      const tempWallet = new wallet.constructor(sweepKey, { interface: 'consumer-api', restURL: wallet.bchjs.restURL });
      await tempWallet.walletInfoPromise;
      
      const satsBalance = await tempWallet.getBalance();
      const bchBalance = wallet.bchjs.BitcoinCash.toBitcoinCash(satsBalance);
      
      if (satsBalance === 0) {
        setNotification({ type: 'warning', message: 'Paper wallet has zero balance' });
        setPhase('input');
        return;
      }

      setPaperWalletInfo({
        address: tempWallet.walletInfo.cashAddress,
        satsBalance,
        bchBalance,
        targetAddress: wallet.walletInfo.cashAddress
      });
      
      setPhase('confirm');
      setNotification({ type: 'success', message: `Found ${bchBalance} BCH in paper wallet` });
    } catch (error) {
      console.error('Error checking paper wallet:', error);
      setNotification({ type: 'error', message: 'Failed to check paper wallet balance' });
      setPhase('input');
    } finally {
      setBusy(false);
    }
  };

  // Execute the sweep
  const handleSweep = async () => {
    if (!paperWalletInfo) return;

    try {
      setPhase('sweeping');
      setBusy(true);
      setNotification({ type: 'info', message: 'Sweeping funds...' });

      const privateKey = wallet?.walletInfo?.privateKey;
      const slpAddress = wallet?.walletInfo?.slpAddress;
      if (!privateKey || !slpAddress) throw new Error('Wallet info is invalid.');
      
      const sweeper = new Sweep(sweepKey, privateKey, wallet);
      if (!sweeper) throw new Error('Sweep library is invalid.');

      await sweeper.populateObjectFromNetwork();
      const transactionHex = await sweeper.sweepTo(slpAddress);
      const txid = await sweeper.blockchain.broadcast(transactionHex);
      
      console.log(`Sweep completed - TXID: ${txid}`);
      console.log(`Explorer: https://blockchair.com/bitcoin-cash/transaction/${txid}`);
      
      setNotification({ 
        type: 'success', 
        message: `Swept ${paperWalletInfo.bchBalance} BCH successfully! TXID: ${txid.substring(0, 8)}...` 
      });
      
      // Reset state
      resetSweepState();
    } catch (error) {
      console.error('Error sweeping wallet:', error);
      setNotification({ type: 'error', message: 'Failed to sweep wallet: ' + error.message });
      setPhase('confirm');
    } finally {
      setBusy(false);
    }
  };

  // Reset all state
  const resetSweepState = () => {
    setSweepKey('');
    setPaperWalletInfo(null);
    setValidationError('');
    setPhase('input');
    setShowScanner(false);
  };

  // Cancel operation
  const handleCancel = () => {
    if (busy) return;
    resetSweepState();
  };

  // Render different phases
  const renderInputPhase = () => (
    <>
      <label htmlFor="private-key" className="form-label">
        Private Key (WIF)
      </label>
      <div className="form-input-group">
        <input
          id="private-key"
          type="text"
          value={sweepKey}
          onChange={(e) => handleInputChange(e.target.value)}
          disabled={busy}
          className={`form-input ${validationError ? 'error' : ''}`}
          placeholder="Enter private key (L... or K... or 5...)"
        />
        <button
          type="button"
          onClick={() => setShowScanner(true)}
          disabled={busy}
          className="scan-button"
          title="Scan QR code"
        >
          QR Scan
        </button>
      </div>
      {validationError && (
        <div className="validation-error">
          {validationError}
        </div>
      )}
      {sweepKey && !validationError && (
        <div className="validation-success">
          ✓ Valid WIF format
        </div>
      )}
      
      <div className="form-actions">
        <button
          type="button"
          onClick={checkPaperWallet}
          className="check-button"
          disabled={!walletConnected || busy || !sweepKey || validationError}
        >
          {busy && phase === 'checking' ? 'Checking...' : 'Check Balance'}
        </button>
      </div>
      
      {showScanner && (
        <div className="qr-scanner-modal">
          <button
            type="button"
            disabled={busy}
            className="close-scanner-button"
            onClick={() => setShowScanner(false)}
          >
            Close Scanner
          </button>
          <QrCodeScanner onAddressDetected={handleAddressDetected} />
        </div>
      )}
    </>
  );

  const renderConfirmPhase = () => (
    <>
      <h3>Confirm Sweep Operation</h3>
      <div className="info-row">
        <span className="label">From Address:</span>
        <span className="value monospace">{paperWalletInfo?.address}</span>
      </div>
      <div className="info-row">
        <span className="label">To Address:</span>
        <span className="value monospace">{paperWalletInfo?.targetAddress}</span>
      </div>
      <div className="info-row">
        <span className="label">Amount:</span>
        <span className="value highlight">{paperWalletInfo?.bchBalance} BCH</span>
      </div>
      
      <div className="warning-box">
        <strong>⚠️ Warning:</strong> This operation will move all funds from the paper wallet to your current wallet. This action cannot be undone.
      </div>
      
      <div className="form-actions">
        <button
          type="button"
          onClick={handleCancel}
          className="cancel-button"
          disabled={busy}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSweep}
          className="sweep-button"
          disabled={busy}
        >
          {busy && phase === 'sweeping' ? 'Sweeping...' : 'Confirm Sweep'}
        </button>
      </div>
    </>
  );

  return (
    <div className="sweeper-container">
      {phase === 'input' && renderInputPhase()}
      {phase === 'checking' && renderInputPhase()}
      {(phase === 'confirm' || phase === 'sweeping') && renderConfirmPhase()}
    </div>
  );
};

export default Sweeper;