import { useState } from 'react';
import { useAtom } from 'jotai';
import { walletAtom, walletConnectedAtom } from '../atoms';
import PropTypes from 'prop-types';

const AddressDisplay = ({ showCopy = true }) => {
  const [wallet] = useAtom(walletAtom);
  const [walletConnected] = useAtom(walletConnectedAtom);
  const [copied, setCopied] = useState(false);

  if (!walletConnected || !wallet?.walletInfo?.cashAddress) {
    return null;
  }

  const address = wallet.walletInfo.cashAddress;
  
  // Format address like mainnet wallet: xxxxxx...yyyyyy
  const formatAddress = (addr) => {
    // Remove prefix if present
    const cleanAddress = addr.replace(/^(bitcoincash:|bchtest:|bchreg:)/, '');
    
    if (cleanAddress.length > 12) {
      return `${cleanAddress.substring(0, 6)}...${cleanAddress.substring(cleanAddress.length - 6)}`;
    }
    return cleanAddress;
  };

  const handleCopyAddress = async () => {
    if (!showCopy) return;
    
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  return (
    <div className="address-display">
      <div className="address-label">Address:</div>
      <div 
        className={`address-value ${showCopy ? 'clickable' : ''}`}
        onClick={handleCopyAddress}
        title={showCopy ? (copied ? 'Copied!' : 'Click to copy full address') : address}
      >
        {formatAddress(address)}
        {showCopy && copied && <span className="copy-indicator">Copied!</span>}
      </div>
    </div>
  );
};

AddressDisplay.propTypes = {
  showCopy: PropTypes.bool
};

export default AddressDisplay;