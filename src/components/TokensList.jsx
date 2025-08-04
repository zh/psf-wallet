import { useState } from 'react';
import { useAtom } from 'jotai';
import { walletConnectedAtom } from '../atoms';
import { useTokensList } from '../hooks'
import TokenCard from './TokenCard';

const TokensList = () => {
  const [walletConnected] = useAtom(walletConnectedAtom);
  const [selectedToken, setSelectedToken] = useState(null);
  const { loading, error, tokens, refreshTokens } = useTokensList(30*1000);

  if (!walletConnected) {
    return <div className="container tokens-list-container">Please connect your wallet</div>;
  }

  // Render the zoomed-in TokenCard if a token is selected
  if (selectedToken) {
    return (
      <div className="zoomed-token-wrapper">
        <TokenCard
          token={selectedToken}
          refreshTokenList={refreshTokens}
          onZoomOut={() => setSelectedToken(null)} // Handler to exit zoom mode
          zoomed
        />
      </div>
    );
  }

  return (
    <>
      <div className="tokens-list-wrapper">
        {loading && <div className="loading-message">Loading tokens...</div>}
        {error && <div className="error-message">Error: {error}</div>}

        {!loading && !error && tokens.length > 0 && (
          <div className="token-list">
            {tokens.map((token, index) => (
              <TokenCard
                key={token.tokenId || index}
                token={token}
                onClick={() => setSelectedToken(token)}
              />
            ))}
          </div>
        )}

        {!loading && !error && tokens.length === 0 && (
          <div className="no-tokens">
            <p>No tokens found in your wallet</p>
            <p className="no-tokens-subtitle">Tokens will appear here once you receive them</p>
          </div>
        )}
      </div>
    </>
  );
};

export default TokensList;

