import { useState } from 'react';
import PropTypes from 'prop-types';
import { useAtom, useSetAtom } from 'jotai';
import {
  busyAtom,
  notificationAtom,
  walletAtom,
  walletConnectedAtom,
} from '../atoms';
import QrCodeScanner from './QrCodeScanner';

const SendTokens = ({ token, onAllTokensSent }) => {
  const [wallet] = useAtom(walletAtom);
  const [walletConnected] = useAtom(walletConnectedAtom);
  const setNotification = useSetAtom(notificationAtom);
  const [busy, setBusy] = useAtom(busyAtom);

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const handleAddressDetected = (scannedData) => {
    if (!walletConnected) {
      setNotification({ type: 'error', message: 'Wallet is not connected.' });
      return;
    }

    if (Array.isArray(scannedData) && scannedData.length > 0) {
      // Extract the first item's rawValue (the actual address)
      const address = scannedData[0].rawValue;
      console.log('address: ', address);
      setRecipient(address); // Set the address in the state
    } else {
      console.error('Invalid scanned data:', scannedData);
    }
    setShowScanner(false);
  };

  const handleSend = async () => {
    if (!walletConnected) {
      setNotification({ type: 'error', message: 'Wallet is not connected.' });
      return;
    }

    if (!recipient.trim()) {
      setNotification({ type: 'error', message: 'Recipient address cannot be empty.' });
      return;
    }

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setNotification({ type: 'error', message: 'Amount must be a positive number.' });
      return;
    }

    try {
      if (amount < 0.00000546) {
        throw new Error('Trying to send less than dust.');
      }
      const bchjs = wallet.bchjs;
      let bchAddr = recipient;
        // If the address is an SLP address, convert it to a cash address.
      if (!bchAddr.includes('bitcoincash:')) {
        bchAddr = bchjs.SLP.Address.toCashAddress(bchAddr);
      }
      if (amount > token.qty) {
        throw new Error('Trying to send more then MAX.');
      }
      console.log(`Sending ${amount} tokens to ${recipient}`);

      setBusy(true);
      await wallet.getUtxos();

      const receivers = [
        {
          address: bchAddr,
          tokenId: token.tokenId,
          qty: amount
        }
      ];
      const txid = await wallet.sendTokens(receivers, 3);

      console.log(`txid: ${txid}`);
      var explorerUrl = `https://blockchair.com/bitcoin-cash/transaction/${txid}`;
      console.log(`explorer 1: ${explorerUrl}`);
      explorerUrl = `https://bch.loping.net/tx/${txid}`;
      console.log(`explorer 2: ${explorerUrl}`);
      console.log('Updating tokens balance...');

      await wallet.getUtxos();
      let updatedToken = null;
      const tokens = await wallet.listTokens();
      if (tokens) {
        tokens.forEach((t) => {
          if (t.tokenId === token.tokenId) {
            updatedToken = t;
          }
        });
      }
      if (!updatedToken) {
        onAllTokensSent();
      }

      setAmount('');
      setRecipient('');
      setNotification({ type: 'success', message: `${amount} tokens sent.` });
    } catch (error) {
      setNotification({ type: 'error', message: `Tokens send failed: ${error.message}` });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container send-tokens-container">
      <fieldset className="form-group">
        <legend>[ Send tokens]</legend>
      <div className="send-group">
        <label htmlFor="recipient-address">Recipient Address:</label>
        <div className="form-input-group">
          <input
            id="recipient-address"
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            disabled={busy}
            placeholder="Enter recipient's address"
            className="form-input"
          />
          <button
            disabled={busy}
            onClick={() => setShowScanner(true)}
            className="scan-button"
          >
            Scan QR
          </button>
        </div>
      </div>
      <div className="send-group">
        <label htmlFor="amount">Amount:</label>
        <input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={busy}
          placeholder="Enter token amount"
          className="form-input"
        />
        <small className="max-balance-info">Max: {token.qty} tokens</small>
      </div>
      <button
        onClick={handleSend}
        disabled={busy || !amount || !recipient.trim() || !walletConnected}
        className="send-button"
      >
        Send
      </button>
      {showScanner && (
         <div>
           <button
              disabled={busy}
              className="close-scanner-button"
              onClick={() => setShowScanner(false)}
           >
             Close Scanner
           </button>
           <QrCodeScanner onAddressDetected={handleAddressDetected} />
         </div>
       )}
      </fieldset>
    </div>
  );
};

SendTokens.propTypes = {
  token: PropTypes.shape({
    tokenId: PropTypes.string.isRequired,
    qty: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  }).isRequired,
  onAllTokensSent: PropTypes.func.isRequired,
};

export default SendTokens;

