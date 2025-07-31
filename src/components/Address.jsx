import PropTypes from 'prop-types';
import { useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { QRCodeSVG } from 'qrcode.react';
import { notificationAtom, walletConnectedAtom, walletAtom } from '../atoms';

const Address = ({
  addressFormat = 'long',
  showQR = true,
  showSLP = false,
  showSwitch = false,
}) => {
  const setNotification = useSetAtom(notificationAtom);
  const [walletConnected] = useAtom(walletConnectedAtom);
  const [wallet] = useAtom(walletAtom);
  const [selectedAddressType, setSelectedAddressType] = useState(showSLP ? 'SLP' : 'BCH');

  if (!walletConnected || !wallet) return;

  const shortify = (address) => {
    return `${address.split(':')[1].substr(0, 4)}...${address.split(':')[1].substr(-4)}`
  }

  const handleSwitch = (type) => {
    setSelectedAddressType(type);
  };

  const handleCopyToClipboard = (address) => {
    navigator.clipboard.writeText(address).then(
      () => {
        setNotification({ type: 'success', message: 'Address copied to clipboard!' });
      },
      (err) => {
        console.error('Failed to copy address: ', err);
        setNotification({ type: 'error', message: 'Failed to copy address.' });
      }
    );
  };

  const displayAddress = selectedAddressType === 'BCH' ? wallet?.walletInfo?.cashAddress : wallet?.walletInfo?.slpAddress;

  return (
    <>
      {showQR && (
        <div className="qr-code-container" onClick={() => handleCopyToClipboard(displayAddress)}>
          <QRCodeSVG value={displayAddress} size={128} />
          <p className="qr-code-instruction">Click QR to copy address</p>
        </div>
      )}
      {showSwitch && (
      <div className="switch-address-container">
      <div className="switch">
        <input
          type="radio"
          id="bch"
          name="addressType"
          value="BCH"
          checked={selectedAddressType === 'BCH'}
          onChange={() => handleSwitch('BCH')}
        />
        <label htmlFor="bch">BCH</label>

        <input
          type="radio"
          id="slp"
          name="addressType"
          value="SLP"
          checked={selectedAddressType === 'SLP'}
          onChange={() => handleSwitch('SLP')}
        />
        <label htmlFor="slp">SLP</label>

        <div className="toggle"></div>
      </div>
      </div>
      )}
      <p className="wallet-address wallet-address-long">
        <strong>{`${selectedAddressType} Address:`}</strong> {addressFormat === 'long' ? displayAddress : shortify(displayAddress)}
      </p>
      <p className="wallet-address wallet-address-short">
        <strong>{selectedAddressType}</strong> {shortify(displayAddress)}
      </p>
    </>
  );
};

// PropTypes validation
Address.propTypes = {
  addressFormat: PropTypes.oneOf(['short', 'long']).isRequired, // 'short' or 'long' format
  showQR: PropTypes.bool, // Whether to display the QR code
  showSLP: PropTypes.bool, // Whether to display the SLP address
  showSwitch: PropTypes.bool, // Whether to display the BCH/SLP switch
};

export default Address;
