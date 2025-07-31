// src/hooks/useConnectWallet.js
import { useAtom } from 'jotai';
import { mnemonicAtom, optionsAtom, walletConnectedAtom, walletAtom } from '../atoms';
import { handleError, validateOrThrow } from '../utils/errorHandler';

const useConnectWallet = () => {
  const [mnemonic] = useAtom(mnemonicAtom);
  const [options] = useAtom(optionsAtom);
  const [walletConnected, setWalletConnected] = useAtom(walletConnectedAtom);
  const [, setWallet] = useAtom(walletAtom);

  const connectWallet = async () => {
    try {
      validateOrThrow(mnemonic.trim(), 'Mnemonic is required to initialize wallet.');
      validateOrThrow(window.SlpWallet, 'Wallet library is not available.');

      const SlpLibrary = window.SlpWallet;
      const bchWallet = new SlpLibrary(mnemonic, options);
      await bchWallet.initialize();
      setWallet(bchWallet);
      setWalletConnected(true);
    } catch (error) {
      setWallet(null);
      const handledError = handleError(error);
      throw new Error(handledError.message);
    }
  };

  const disconnectWallet = () => {
    setWallet(null); // Reset walletAtom
    setWalletConnected(false);
  };

  return {
    connectWallet,
    disconnectWallet,
    walletConnected,
  };
};

export default useConnectWallet;

