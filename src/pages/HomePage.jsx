import MobileLayout from '../components/Layout/MobileLayout';
import Balance from '../components/Balance';
import Address from '../components/Address';
import { useAtom } from 'jotai';
import { walletConnectedAtom } from '../atoms';
import { useConnectWallet } from '../hooks';
import '../styles/home.css';
import '../styles/receive.css';

const HomePage = () => {
  const [walletConnected] = useAtom(walletConnectedAtom);
  const { disconnectWallet } = useConnectWallet();

  const handleDisconnect = () => {
    disconnectWallet();
  };


  return (
    <MobileLayout title="Wallet">
      <div className="home-content">
        {/* Disconnect button at top */}
        {walletConnected && (
          <div className="wallet-actions-top">
            <button
              onClick={handleDisconnect}
              className="disconnect-button-top"
            >
              Disconnect
            </button>
          </div>
        )}

        {/* Address component (QR + address) */}
        {walletConnected && (
          <div className="address-section">
            <Address
              addressFormat={'long'}
              showSLP={false}
              showQR={true}
              showSwitch={true}
            />
          </div>
        )}

        {/* Balance component */}
        <div className="wallet-overview">
          <Balance />
        </div>
      </div>
    </MobileLayout>
  );
};

export default HomePage;