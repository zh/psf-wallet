// Alternative sources for SLP token icons (2025 updated)
// Note: Using fetch instead of axios to avoid additional dependencies
// SLPDB servers removed due to unreliability
// raw.githubusercontent.com replaced with reliable CDN alternatives

// jsDelivr CDN sources - enterprise-grade reliability with permanent caching
const JSDELIVR_ICON_SOURCES = [
  'https://cdn.jsdelivr.net/gh/kosinusbch/slp-token-icons@master',  // Most actively maintained
  'https://cdn.jsdelivr.net/gh/Bitcoin-com/bch-token-icons@master', // Legacy but stable
  'https://cdn.jsdelivr.net/gh/cgar420/bch-token-icons@master'      // Additional source
];

// raw.githack.com CDN sources - CloudFlare CDN with proper Content-Type headers
const GITHACK_ICON_SOURCES = [
  'https://raw.githack.com/kosinusbch/slp-token-icons/master',
  'https://raw.githack.com/Bitcoin-com/bch-token-icons/master',
  'https://raw.githack.com/cgar420/bch-token-icons/master'
];

// BCMR API endpoints for modern token metadata
const BCMR_ENDPOINTS = [
  'https://bcmr.paytaca.com/api/tokens',  // Primary BCMR service
  // Add more BCMR endpoints as they become available
];

// SLPDB functionality removed - servers are unreliable

// Try BCMR API for modern token metadata and icons
export const getBCMRTokenIcon = async (tokenId) => {
  for (const endpoint of BCMR_ENDPOINTS) {
    try {
      const apiUrl = `${endpoint}/${tokenId}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(apiUrl, {
        signal: controller.signal,
        mode: 'cors',
        headers: {
          'Accept': 'application/json'
        }
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();

        // Check for icon in BCMR metadata structure
        if (data.uris && data.uris.icon) {
          return {
            icon: data.uris.icon,
            download: true,
            source: 'bcmr',
            metadata: data
          };
        }

        // Check for nested icon structure
        if (data.token && data.token.uris && data.token.uris.icon) {
          return {
            icon: data.token.uris.icon,
            download: true,
            source: 'bcmr',
            metadata: data
          };
        }
      }
    } catch {
      // Try next BCMR endpoint
      continue;
    }
  }

  return null;
};

// Try jsDelivr CDN for token icons (primary method)
export const getJsDelivrTokenIcon = async (tokenId, size = 128) => {
  for (const repoBase of JSDELIVR_ICON_SOURCES) {
    try {
      const iconUrl = `${repoBase}/${size}/${tokenId}.png`;

      // Test if the image exists and is accessible
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(iconUrl, {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'cors'
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return {
          icon: iconUrl,
          download: true,
          source: 'jsdelivr'
        };
      }
    } catch {
      // Try next repository
      continue;
    }
  }

  return null;
};

// Try raw.githack.com CDN for token icons (backup method)
export const getGitHackTokenIcon = async (tokenId, size = 128) => {
  for (const repoBase of GITHACK_ICON_SOURCES) {
    try {
      const iconUrl = `${repoBase}/${size}/${tokenId}.png`;

      // Test if the image exists and is accessible
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(iconUrl, {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'cors'
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return {
          icon: iconUrl,
          download: true,
          source: 'githack'
        };
      }
    } catch {
      // Try next repository
      continue;
    }
  }

  return null;
};

// Explorer API functionality removed - focusing only on reliable GitHub icon sources

// Comprehensive token icon fetcher with 2025 reliable sources
export const getTokenDataFromAlternatives = async (tokenId) => {
  const results = {
    icon: null,
    sources: []
  };

  try {
    // 1. First try BCMR API (most modern and comprehensive)
    const bcmrIcon = await getBCMRTokenIcon(tokenId);
    if (bcmrIcon) {
      results.icon = bcmrIcon;
      results.sources.push('BCMR');
      return results;
    }

    // 2. Try jsDelivr CDN (enterprise-grade reliability)
    const jsdelivrIcon = await getJsDelivrTokenIcon(tokenId, 128);
    if (jsdelivrIcon) {
      results.icon = jsdelivrIcon;
      results.sources.push('jsDelivr');
      return results;
    }

    // 3. Try raw.githack.com CDN (CloudFlare backed)
    const githackIcon = await getGitHackTokenIcon(tokenId, 128);
    if (githackIcon) {
      results.icon = githackIcon;
      results.sources.push('GitHack');
      return results;
    }

    return results;

  } catch {
    return results;
  }
};

// Test function to check all alternative services availability
export const testAlternativeServices = async () => {
  const results = {
    bcmr: [],
    jsdelivr: [],
    githack: []
  };

  // Test BCMR endpoints
  for (const endpoint of BCMR_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(endpoint, {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'cors'
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        results.bcmr.push(endpoint);
      }
    } catch {
      // Endpoint unavailable
    }
  }

  // Test jsDelivr repositories
  for (const repo of JSDELIVR_ICON_SOURCES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(repo, {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'cors'
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        results.jsdelivr.push(repo);
      }
    } catch {
      // Repository unavailable
    }
  }

  // Test GitHack repositories
  for (const repo of GITHACK_ICON_SOURCES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(repo, {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'cors'
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        results.githack.push(repo);
      }
    } catch {
      // Repository unavailable
    }
  }

  return results;
};

export default {
  getBCMRTokenIcon,
  getJsDelivrTokenIcon,
  getGitHackTokenIcon,
  getTokenDataFromAlternatives,
  testAlternativeServices
};