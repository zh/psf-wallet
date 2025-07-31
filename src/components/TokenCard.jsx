import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAtom } from 'jotai';
// import { useTokenData } from '../hooks';
import { tokensAtom } from '../atoms';
import Address from './Address';
import SendTokens from './SendTokens';

const TokenCard = ({
  token,
  refreshTokenList,
  onClick = null,
  onZoomOut = null,
  zoomed = false,
  }) => {
  const [tokens] = useAtom(tokensAtom); // Subscribe to tokensAtom
  const [currentToken, setCurrentToken] = useState(token);
  // const { tokenData, loading, error } = useTokenData(token.tokenId);

  useEffect(() => {
    // Update the token details if the token list changes
    const updatedToken = tokens.find((t) => t.tokenId === token.tokenId);
    if (updatedToken) {
      setCurrentToken(updatedToken);
    }
  }, [tokens, token.tokenId]);

  const { tokenId, name, ticker, qty } = currentToken;

  const shortify = (id) => {
    return `${id.substr(0, 4)}...${id.substr(-4)}`
  }

  const handleAllTokensSent = () => {
    onZoomOut(); // Exit the zoomed-in view
    if (typeof refreshTokenList === 'function') {
      refreshTokenList();
    }
  };

  if (zoomed) {
    return (
      <div className="token-card zoomed">
        <button className="back-button" onClick={onZoomOut}>
          Back
        </button>
        <div className="token-icon-placeholder zoomed-icon"></div>
        <div className="token-details zoomed-details">
          <div className="token-id token-id-long"><strong>Token ID:</strong> {tokenId}</div>
          <div className="token-id token-id-short"><strong>ID:</strong> {shortify(tokenId)}</div>
          <div className="token-name"><strong>Name:</strong> {name}</div>
          <div className="token-ticker"><strong>Ticker:</strong> {ticker}</div>
          <div className="token-amount"><strong>Balance:</strong> {qty}</div>
        </div>
        <Address addressFormat={'long'} showSLP={true} showQR={true} />
        <SendTokens token={currentToken} onAllTokensSent={handleAllTokensSent} />
      </div>
    );
  }

  return (
    <div className="token-card" onClick={onClick}>
      <div className="token-icon-placeholder"></div>
      <div className="token-details">
        <div className="token-card-name"><strong>Name:</strong> {name}</div>
        <div className="token-card-ticker"><strong>Ticker:</strong> {ticker}</div>
        <div className="token-card-amount"><strong>Balance:</strong> {qty}</div>
      </div>
    </div>
  );
};

TokenCard.propTypes = {
  token: PropTypes.shape({
    tokenId: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    ticker: PropTypes.string.isRequired,
    qty: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  }).isRequired,
  onClick: PropTypes.func,
  onZoomOut: PropTypes.func,
  zoomed: PropTypes.bool,
  refreshTokenList: PropTypes.func,
};

export default TokenCard;

