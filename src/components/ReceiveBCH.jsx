import PropTypes from 'prop-types';
import { useAtom } from 'jotai';
import { walletConnectedAtom } from '../atoms';
import Address from './Address';
import Balance from './Balance';
import '../styles/receive.css';

const ReceiveBCH = ({ showSLP = false }) => {
  const [walletConnected] = useAtom(walletConnectedAtom);

  if (!walletConnected) {
    return (
      <div className="receive-container">
        <p className="not-connected-message">
          Please connect your wallet to receive BCH.
        </p>
      </div>
    );
  }

  return (
    <div className="receive-container">
      <div className="receive-content">
        <Address
          addressFormat={'long'}
          showSLP={showSLP}
          showQR={true}
          showSwitch={true}
        />
        <Balance showValue={false} />
      </div>
    </div>
  );
};

ReceiveBCH.propTypes = {
  showSLP: PropTypes.bool, // Whether to display SLP address
};

export default ReceiveBCH;
