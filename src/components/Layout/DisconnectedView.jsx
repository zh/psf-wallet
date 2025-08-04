import Mnemonic from '../Mnemonic';
import Notification from '../Notify';
import LoadScript from '../LoadScript';
import Wallet from '../Wallet';
import ThemeToggle from '../ThemeToggle';
import { useAtom } from 'jotai';
import { optionsAtom, walletAtom } from '../../atoms';
import '../../styles/disconnected.css';

const DisconnectedView = () => {
  const [options, setOptions] = useAtom(optionsAtom);
  const [, setWallet] = useAtom(walletAtom);

  const updateRestURL = (url) => {
    setOptions((prevOptions) => ({ ...prevOptions, restURL: url }));
    setWallet(null);
  };

  return (
    <div className="disconnected-view">
      <LoadScript scriptSrc="/minimal-slp-wallet.min.js" />

      <div className="app-header">
        <div className="app-title">
          BCH wallet
        </div>
        <ThemeToggle />
      </div>

      <Notification />

      <div className="wallet-setup">
        <Mnemonic />

        <div className="server-selector">
          <h2>Connection</h2>
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
        </div>

        <Wallet showOptimize={true} />
      </div>

      <div className="app-footer">
        Powered by <a href="https://psfoundation.info" target="_blank" rel="noopener noreferrer">PSF</a>
      </div>
    </div>
  );
};

export default DisconnectedView;