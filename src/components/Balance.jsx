import PropTypes from 'prop-types';
import { useMemo } from 'react';
import { useAtom } from 'jotai';
import { walletConnectedAtom, manualBalanceRefreshAtom } from '../atoms';
import { useBalance, useBchPrice } from '../hooks';

const Balance = ({ showValue = true }) => {
  const [walletConnected] = useAtom(walletConnectedAtom);
  const [, refreshBalance] = useAtom(manualBalanceRefreshAtom);
  const { price } = useBchPrice(showValue, 2*60*1000); // refresh every 5 min
  const { satsBalance, balance, error: balanceError, loading } = useBalance();

  const handleRefresh = () => {
    refreshBalance();
  };

  const isValidBalance = balance !== null && typeof balance === 'number' && balance > 0;
  const isValidPrice = price !== null && typeof price === 'number' && price > 0;

  const balanceInUsd = useMemo(() => {
    if (isValidBalance && isValidPrice) {
      return (balance * price).toFixed(2);
    }
    return null;
  }, [balance, price, isValidBalance, isValidPrice]);

  if (!walletConnected) return null;

  return (
    <div className="balance-display">
      {balanceError && <p className="balance-error">Error: {balanceError}</p>}
      
      {/* Main Balance in BCH */}
      <div className="balance-main">
        {isValidBalance ? (
          <div className="balance-amount">{balance} BCH</div>
        ) : (
          <div className="balance-amount">0 BCH</div>
        )}
      </div>
      
      {/* Secondary info - Sats and USD */}
      <div className="balance-secondary">
        <div className="balance-sats">
          {isValidBalance && satsBalance !== null ? `${satsBalance.toLocaleString()} sat` : '0 sat'}
        </div>
        {showValue && (
          <div className="balance-separator">|</div>
        )}
        {showValue && (
          <div className="balance-usd">
            {balanceInUsd !== null ? `$${balanceInUsd} USD` : '$0.00 USD'}
          </div>
        )}
      </div>
      
      {/* Refresh button - show always, but indicate data saver mode */}
      <div className="balance-actions">
        <button
          onClick={handleRefresh}
          className="balance-refresh-button"
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
    </div>
  );
};

Balance.propTypes = {
  showValue: PropTypes.bool, // Whether to display value in USD
}

export default Balance;
