// src/components/WalletDetails.js
import { useAtom } from 'jotai';
import { walletAtom, walletConnectedAtom } from '../atoms';

const WalletDetails = () => {
  const [wallet] = useAtom(walletAtom);
  const [walletConnected] = useAtom(walletConnectedAtom);

  if (!walletConnected || !wallet) return;

  return (
    <div className="walletdetails-info">
      <p><strong>Server:</strong> {wallet?.advancedOptions?.restURL || 'N/A'}</p>
      <p><strong>Mnemonic:</strong> {wallet.walletInfo?.mnemonic || 'N/A'}</p>
      <p><strong>Private Key:</strong> {wallet?.walletInfo?.privateKey || 'N/A'}</p>
      <p><strong>BCH address:</strong> {wallet?.walletInfo?.cashAddress || 'N/A'}</p>
      <p><strong>SLP address:</strong> {wallet?.walletInfo?.slpAddress || 'N/A'}</p>
      <p><strong>HD Path:</strong> {wallet?.walletInfo?.hdPath || 'N/A'}</p>
    </div>
  );
};

export default WalletDetails;
