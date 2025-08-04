import { useState, useEffect, memo } from 'react';
import PropTypes from 'prop-types';
import { useAtom } from 'jotai';
import { walletConnectedAtom } from '../atoms';
import { useTokenData } from '../hooks';

const PLACEHOLDER_ICON = '/token-placeholder.svg';

const TokenIcon = ({ token, zoomed = false }) => {
  const [walletConnected] = useAtom(walletConnectedAtom);
  const [iconUrl, setIconUrl] = useState(PLACEHOLDER_ICON);
  const [isLoading, setIsLoading] = useState(false);
  const [svg, setSvg] = useState(false);
  const { tokenData, error: tokenDataError } = useTokenData(token);

  useEffect(() => {
    if (!walletConnected || !token) {
      setIconUrl(PLACEHOLDER_ICON);
      setIsLoading(false);
      setSvg(false);
      return;
    }

    if (tokenData) {
      const isSvg = !tokenData.download;
      setSvg(isSvg);

      if (tokenData.download) {
        // Check if this is a known unavailable image (TokenTiger NFTs)
        if (tokenData.source?.includes('unavailable') || tokenData.source?.includes('placeholder')) {
          // Skip image loading for known unavailable images
          setIconUrl(PLACEHOLDER_ICON);
          setIsLoading(false);
          return;
        }

        // For downloadable images, test loading first
        const image = new Image();
        setIsLoading(true);

        // Reduced timeout for faster fallback
        const timeoutId = setTimeout(() => {
          setIconUrl(PLACEHOLDER_ICON);
          setIsLoading(false);
        }, 2000);

        image.onload = () => {
          clearTimeout(timeoutId);
          setIconUrl(tokenData.icon);
          setIsLoading(false);
        };

        image.onerror = () => {
          clearTimeout(timeoutId);
          setIconUrl(PLACEHOLDER_ICON);
          setIsLoading(false);
        };

        // Use placeholder as fallback
        image.src = tokenData.icon || PLACEHOLDER_ICON;
      } else {
        // For SVG content (Pouns, generated icons), display directly
        // Use setTimeout to ensure DOM element exists
        setTimeout(() => {
          const element = document.getElementById(`svgContainer-${token.tokenId}`);
          if (element && tokenData.icon) {
            try {
              // Handle different SVG size patterns (Pouns uses 320x320)
              let resizedIcon = tokenData.icon;
              if (zoomed) {
                // For zoomed view, make it larger
                resizedIcon = tokenData.icon
                  .replace('svg width="320" height="320"', 'svg width="128" height="128"')
                  .replace('svg width="64" height="64"', 'svg width="128" height="128"');
              } else {
                // For normal view, make it standard size
                resizedIcon = tokenData.icon
                  .replace('svg width="320" height="320"', 'svg width="64" height="64"')
                  .replace('svg width="128" height="128"', 'svg width="64" height="64"');
              }

              element.innerHTML = resizedIcon;
            } catch {
              // If SVG parsing fails, fallback to placeholder
              setSvg(false);
              setIconUrl(PLACEHOLDER_ICON);
            }
          }
        }, 50); // Reduced delay

        setIsLoading(false);
      }
    } else if (tokenDataError) {
      // Handle token data errors silently
      setIconUrl(PLACEHOLDER_ICON);
      setIsLoading(false);
      setSvg(false);
    }
  }, [walletConnected, tokenData, tokenDataError, zoomed, token]);

  const iconClass = `token-icon ${zoomed ? 'zoomed-icon' : ''} ${isLoading ? 'loading-icon' : ''}`;

  if (!token) {
    return (
      <img
        src={PLACEHOLDER_ICON}
        alt="Default token icon"
        className={iconClass}
      />
    );
  }

  return (
    <>
      {svg ? (
        <div
          className={iconClass}
          id={`svgContainer-${token.tokenId}`}
          title={`${token.name || 'Token'} icon (SVG)`}
          style={{
            minWidth: zoomed ? '128px' : '64px',
            minHeight: zoomed ? '128px' : '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* SVG content will be inserted via innerHTML */}
          {!tokenData?.icon && (
            <span style={{fontSize: '12px', color: '#666'}}>
              Loading SVG...
            </span>
          )}
        </div>
      ) : (
        <img
          src={iconUrl}
          alt={`${token.name || 'Token'} icon`}
          className={iconClass}
          onError={() => {
            setIconUrl(PLACEHOLDER_ICON);
          }}
        />
      )}
    </>
  );
};

TokenIcon.propTypes = {
  token: PropTypes.shape({
    tokenId: PropTypes.string.isRequired,
    name: PropTypes.string,
    url: PropTypes.string,
  }),
  zoomed: PropTypes.bool,
};

export default memo(TokenIcon);