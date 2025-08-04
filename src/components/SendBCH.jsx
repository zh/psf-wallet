// src/components/SendBCH.jsx
import { useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import {
  notificationAtom,
  busyAtom,
  balanceAtom,
  walletAtom,
  walletConnectedAtom
} from '../atoms';
import QrCodeScanner from './QrCodeScanner';
import { sanitizeInput, isValidBCHAddress, isValidAmount } from '../utils/validation';
import { handleError, safeAsyncOperation } from '../utils/errorHandler';

const SendBCH = () => {
  const [wallet] = useAtom(walletAtom);
  const [walletConnected] = useAtom(walletConnectedAtom);
  const [balance] = useAtom(balanceAtom);
  const setNotification = useSetAtom(notificationAtom);
  const [busy, setBusy] = useAtom(busyAtom);

  const [sendForm, setSendForm] = useState({
    address: '',
    amount: '',
    unit: 'bch'
  });
  const [showScanner, setShowScanner] = useState(false);

  const handleInputChange = (field, value) => {
    setSendForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatBalance = (bal, unit) => {
    if (!bal || bal === 0) return '0';

    switch (unit) {
      case 'sat':
        return (bal * 100000000).toFixed(0);
      case 'usd':
        // Note: Would need BCH price for real USD conversion
        return (bal * 300).toFixed(2); // Placeholder conversion
      case 'bch':
      default:
        return bal.toFixed(8);
    }
  };

  const convertAmount = (amount, fromUnit) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return 0;

    switch (fromUnit) {
      case 'sat':
        return numAmount / 100000000;
      case 'usd':
        // Note: Would need BCH price for real USD conversion
        return numAmount / 300; // Placeholder conversion
      case 'bch':
      default:
        return numAmount;
    }
  };

  const handleAddressDetected = (scannedData) => {
    if (!walletConnected) {
      setNotification({ type: 'error', message: 'Wallet is not connected.' });
      return;
    }

    try {
      if (Array.isArray(scannedData) && scannedData.length > 0) {
        const rawAddress = scannedData[0].rawValue;
        const sanitizedAddress = sanitizeInput(rawAddress, 'address');

        if (!isValidBCHAddress(sanitizedAddress)) {
          setNotification({ type: 'error', message: 'Invalid BCH address format.' });
          return;
        }

        handleInputChange('address', sanitizedAddress);
        setNotification({ type: 'success', message: 'Address scanned successfully.' });
      } else {
        setNotification({ type: 'error', message: 'Could not read QR code data.' });
      }
    } catch (error) {
      const handledError = handleError(error, 'qr_scan');
      setNotification({ type: 'error', message: handledError.message });
    }
    setShowScanner(false);
  };

  const handleSend = async (e) => {
    e.preventDefault();

    if (!walletConnected) {
      setNotification({ type: 'error', message: 'Wallet is not connected.' });
      return;
    }

    try {
      // Validate and sanitize inputs
      const sanitizedRecipient = sanitizeInput(sendForm.address, 'address');
      const sanitizedAmount = sanitizeInput(sendForm.amount, 'amount');

      if (!sanitizedRecipient) {
        setNotification({ type: 'error', message: 'Recipient address cannot be empty.' });
        return;
      }

      if (!isValidBCHAddress(sanitizedRecipient)) {
        setNotification({ type: 'error', message: 'Invalid recipient address format.' });
        return;
      }

      if (!isValidAmount(sanitizedAmount, 'bch')) {
        setNotification({ type: 'error', message: 'Invalid amount. Please enter a valid number.' });
        return;
      }

      const bchAmount = convertAmount(sanitizedAmount, sendForm.unit);
      if (bchAmount < 0.00000546) {
        setNotification({ type: 'error', message: 'Amount too small. Minimum is 546 satoshis.' });
        return;
      }

      setBusy(true);

      const result = await safeAsyncOperation(
        async () => {
          const bchjs = wallet.bchjs;
          let bchAddr = sanitizedRecipient;

          // Convert SLP address to cash address if needed
          if (!bchAddr.includes('bitcoincash:')) {
            bchAddr = bchjs.SLP.Address.toCashAddress(bchAddr);
          }

          const sats = bchjs.BitcoinCash.toSatoshi(bchAmount);
          const satsBalance = bchjs.BitcoinCash.toSatoshi(balance || 0);

          if (sats > satsBalance) {
            throw new Error('Insufficient balance for this transaction.');
          }

          // Update UTXOs
          await wallet.getUtxos();

          const receivers = [{
            address: sanitizedRecipient,
            amountSat: sats,
          }];

          return await wallet.send(receivers);
        },
        'send_bch'
      );

      // Reset form and show success
      setSendForm({
        address: '',
        amount: '',
        unit: 'bch'
      });
      setNotification({
        type: 'success',
        message: `${bchAmount} BCH sent! TXID: ${result.substring(0, 8)}...`
      });
    } catch (error) {
      const handledError = handleError(error, 'send_transaction');
      setNotification({ type: 'error', message: handledError.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sendbch-container">
      <h2>Send</h2>

      <form onSubmit={handleSend}>
          {/* Address Input with QR Scanner */}
          <div className="send-group">
            <div className="form-input-group">
              <input
                type="text"
                value={sendForm.address}
                onChange={(e) => handleInputChange('address', sanitizeInput(e.target.value, 'address'))}
                placeholder="Recipient address (bitcoincash:...)"
                disabled={busy}
                className="form-input"
              />
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="scan-button"
                disabled={busy}
              >
                QR Scan
              </button>
            </div>
            {sendForm.address && !isValidBCHAddress(sendForm.address) && (
              <div className="error-text">
                Invalid BCH address format
              </div>
            )}

            {/* QR Scanner Modal */}
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
          </div>

          {/* Amount Input with Unit Selector */}
          <div className="send-group">
            <div className="form-input-group">
              <input
                type="number"
                value={sendForm.amount}
                onChange={(e) => handleInputChange('amount', sanitizeInput(e.target.value, 'amount'))}
                placeholder="Amount"
                step="any"
                min="0"
                disabled={busy}
                className="form-input"
              />
              <select
                value={sendForm.unit}
                onChange={(e) => handleInputChange('unit', e.target.value)}
                disabled={busy}
                className="unit-select"
              >
                <option value="bch">BCH</option>
                <option value="sat">SAT</option>
                <option value="usd">USD</option>
              </select>
            </div>
            <div className="balance-info">
              Available: {formatBalance(balance || 0, sendForm.unit)} {sendForm.unit.toUpperCase()}
            </div>
          </div>

          {/* Send Button */}
          <div className="send-actions">
            <button
              type="submit"
              className="send-button"
              disabled={busy || !sendForm.address || !sendForm.amount || !walletConnected}
            >
              {busy ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
    </div>
  );
};

export default SendBCH;
