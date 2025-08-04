import { Buffer } from 'buffer';
import { getContracts, generatePoun } from 'pouns-sdk';
import { SlpMutableData } from 'slp-mutable-data';

// IPFS gateway system with verified working gateways (January 2025)
const IPFS_GATEWAYS = [
  // TokenTiger NFT gateway (for TokenTiger NFTs)
  'https://files.tokentiger.com/ipfs/view/', // TokenTiger specific

  // Primary gateways - verified working and fastest (from Public Gateway Checker)
  'https://gateway.pinata.cloud/ipfs/',  // 0.15s - fastest
  'https://ipfs.io/ipfs/',               // 0.22s - IPFS Foundation
  'https://4everland.io/ipfs/',          // 0.32s - Web3 hosting
  'https://dweb.link/ipfs/',             // 0.33s - IPFS Foundation subdomain

  // Subdomain gateways for better security (verified working)
  'https://{CID}.ipfs.dweb.link/',       // IPFS Foundation subdomain
  'https://{CID}.w3s.link/',             // Web3 Storage

  // Additional reliable gateways
  'https://nftstorage.link/ipfs/',       // 0.55s - NFT Storage
  'https://trustless-gateway.link/ipfs/', // 0.24s - IPFS Foundation trustless
];

// Domains known to cause CORS issues
const BLOCKED_DOMAINS = [
  'tokens.bch.sx',
  'bch.sx',
  'simpleledger.cash'
];

// Juungle NFT API endpoint
const JUUNGLE = 'https://www.juungle.net/api/v1/nfts/icon';

// IPFS Gateway Configuration - Use TokenTiger instead of failing PSF gateway
const PSF_IPFS_GATEWAY = 'files.tokentiger.com/ipfs/view'; // TokenTiger gateway (working)
const CID_URL_TYPE = 1; // 1 = directory format, 2 = subdomain format

// Initialize slp-mutable-data instance (will be created per wallet)
let slpMutableDataCache = new Map();

// Get or create slp-mutable-data instance for a wallet
const getSlpMutableData = (wallet) => {
  const walletKey = wallet.walletInfoPromise ? 'wallet' : 'mock';

  if (!slpMutableDataCache.has(walletKey)) {
    const slpMutableDataOptions = {
      wallet: wallet,
      cidUrlType: CID_URL_TYPE,
      ipfsGatewayUrl: PSF_IPFS_GATEWAY
    };
    slpMutableDataCache.set(walletKey, new SlpMutableData(slpMutableDataOptions));
  }

  return slpMutableDataCache.get(walletKey);
};

// PSF URL optimization function (ported from official slp-token-media library)
const optimizeUrl = (entry, ipfsGatewayUrl = PSF_IPFS_GATEWAY, cidUrlType = CID_URL_TYPE) => {
  if (!entry) return '';

  let entryIsString = true;
  if (typeof(entry) !== 'string') entryIsString = false;

  if (typeof(entry) !== 'object' && !entryIsString) {
    throw new Error('entry is neither a string nor an object');
  }

  let outStr = '';

  if (entryIsString) {
    // Entry is a string - extract CID and optimize URL
    const regex = /Qm[1-9A-HJ-NP-Za-km-z]{44,}|b[A-Za-z2-7]{58,}|B[A-Z2-7]{58,}|z[1-9A-HJ-NP-Za-km-z]{48,}|F[0-9A-F]{50,}/;
    let cid = '';

    try {
      const match = entry.match(regex);
      cid = match[0];
    } catch {
      // If no CID found, return original entry
      return entry;
    }

    try {
      const url = new URL(entry);
      const pathname = url.pathname;
      const splitPath = pathname.split(cid);
      const correctPath = splitPath[splitPath.length - 1];

      if (cidUrlType === 1) {
        outStr = `https://${ipfsGatewayUrl}/ipfs/${cid}${correctPath}`;
      } else {
        if (cid.includes('Qm')) {
          // CID v0 do not work for URL type 2
          outStr = entry;
        } else {
          // CID v1
          outStr = `https://${cid}.${ipfsGatewayUrl}${correctPath}`;
        }
      }
    } catch {
      return entry;
    }

  } else {
    // Entry is an object (PS007 format)
    if (!entry.default) {
      throw new Error('Media does not follow PS007. Media is an object, but has no default property.');
    }

    // By default, return the default URL
    outStr = entry.default;

    // If the object has an IPFS property, use that
    if (entry.ipfs) {
      let cid = entry.ipfs.cid;

      // If the CID contains a prefix, remove it
      if (cid.includes('ipfs://')) {
        cid = cid.slice(7);
      }

      const path = entry.ipfs.path;

      if (cidUrlType === 1) {
        outStr = `https://${ipfsGatewayUrl}/ipfs/${cid}${path}`;
      } else {
        if (cid.includes('Qm')) {
          // CID v0 do not work for URL type 2
          outStr = entry.default;
        } else {
          // CID v1
          outStr = `https://${cid}.${ipfsGatewayUrl}${path}`;
        }
      }
    } else {
      // Recursively optimize the default property
      outStr = optimizeUrl(entry.default, ipfsGatewayUrl, cidUrlType);
    }
  }

  return outStr;
};

// Validate URL function (from PSF library)
const validateUrl = async (url) => {
  let outUrl = '';

  if (url) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'cors'
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        outUrl = url;
      }
    } catch {
      // URL validation failed, return empty string
    }
  }

  return outUrl;
};

const isBlockedDomain = (url) => {
  try {
    const urlObj = new URL(url);
    return BLOCKED_DOMAINS.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
};

// Test gateway availability with timeout and enhanced error handling
const testGateway = async (gatewayUrl, timeout = 2000) => {
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(gatewayUrl, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-cache',
      mode: 'cors' // Explicitly set CORS mode
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    return { success: response.ok, responseTime };
  } catch (error) {
    const responseTime = Date.now() - startTime;

    // Enhanced error classification for silent handling
    let errorType = 'unknown';
    let isCorsError = false;

    if (error.name === 'AbortError') {
      errorType = 'timeout';
    } else if (error.name === 'TypeError') {
      if (error.message.includes('CORS') || error.message.includes('cors')) {
        errorType = 'cors';
        isCorsError = true;
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorType = 'network';
      } else if (error.message.includes('ERR_NAME_NOT_RESOLVED')) {
        errorType = 'dns';
      }
    }

    // Silent error handling - no console logging
    return {
      success: false,
      responseTime,
      corsError: isCorsError,
      errorType
    };
  }
};

// Simple cache for successful gateways (5 minute TTL)
const gatewayCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Get best available IPFS gateway for a CID (sequential testing)
const getBestGateway = async (cid) => {
  // Check cache first
  const cacheKey = `gateway_${cid}`;
  const cached = gatewayCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.gateway;
  }

  // Always use IPFS_GATEWAYS which has TokenTiger first in priority
  const gatewaysToTest = IPFS_GATEWAYS;

  // Test gateways sequentially, not concurrently to avoid console spam
  for (const gateway of gatewaysToTest) {
    let testUrl;
    if (gateway.includes('{CID}')) {
      testUrl = gateway.replace('{CID}', cid);
    } else {
      testUrl = `${gateway}${cid}`;
    }

    try {
      // Use shorter timeout for TokenTiger, longer for others
      const timeout = gateway.includes('tokentiger.com') ? 3000 : 2000;
      const result = await testGateway(testUrl, timeout);

      if (result.success && !result.corsError) {
        // Cache successful gateway
        gatewayCache.set(cacheKey, {
          gateway: { gateway, testUrl, ...result },
          timestamp: Date.now()
        });

        return { gateway, testUrl, ...result };
      }
    } catch {
      // Silently continue to next gateway
      continue;
    }
  }

  // No working gateway found
  return null;
};

// Helper function to detect if a string contains an IPFS hash (following user's clarification)
const extractIPFSHash = (url) => {
  if (!url || typeof url !== 'string') return null;

  // IPFS hash regex patterns
  const ipfsHashRegex = /Qm[1-9A-HJ-NP-Za-km-z]{44,}|bafyb[a-zA-Z0-9]{50,}|bafkr[a-zA-Z0-9]{50,}|b[A-Za-z2-7]{58,}|B[A-Z2-7]{58,}|z[1-9A-HJ-NP-Za-km-z]{48,}|F[0-9A-F]{50,}/;

  try {
    const match = url.match(ipfsHashRegex);
    return match ? match[0] : null;
  } catch {
    return null;
  }
};


// Process different URL types for icon fetching (token-wallet compatible)
const getMedia = async (url, config = {}) => {
  try {
    // Primary: Try GitHub alternative sources first (most reliable)
    if (url === 'alternatives://') {
      return processAlternatives(config);
    }

    if (!url) {
      // No URL provided, go straight to GitHub alternatives
      return processAlternatives(config);
    }

    // Handle special pouns/nouns array syntax
    if (url.startsWith('nouns://[') || url.startsWith('pouns://[')) {
      return processPouns(url.substring(8), config);
    }

    // ENHANCED: Check if document URL contains IPFS hash (per user's clarification)
    const ipfsHash = extractIPFSHash(url);
    if (ipfsHash) {
      // Document URL contains IPFS hash - try PS007 processing first, then direct image
      const ipfsResult = await processIPFS(ipfsHash, config);
      if (ipfsResult) return ipfsResult;
      // Fall through to standard URL processing if IPFS processing fails
    }

    // Standard URL parsing
    try {
      const tokenURL = new URL(url);

      if (tokenURL.protocol === 'ipfs:') {
        const ipfsResult = await processIPFS(url.substring(7), config);
        if (ipfsResult) return ipfsResult;
        return processAlternatives(config);
      }

      if (tokenURL.protocol === 'http:' || tokenURL.protocol === 'https:') {
        if (isBlockedDomain(url)) {
          return processAlternatives(config);
        }
        return processHTTP(url, config);
      }

      if (tokenURL.protocol === 'pouns:' || tokenURL.protocol === 'nouns:') {
        return processPouns(tokenURL.hostname, config);
      }


      if (tokenURL.protocol === 'juungle:') {
        return processJuungle(config);
      }

      if (tokenURL.protocol === 'legacy:') {
        return processLegacy(config);
      }

    } catch {
      // If URL parsing fails, try as direct CID or fallback
      if (url.match(/^[Qm][a-zA-Z0-9]{44}$/) || url.match(/^bafyb[a-zA-Z0-9]+$/)) {
        const ipfsResult = await processIPFS(url, config);
        if (ipfsResult) return ipfsResult;
      }
    }

    // Default fallback to GitHub alternatives
    return processAlternatives(config);
  } catch {
    // Silent error handling - try GitHub as final fallback
    return processAlternatives(config);
  }
};

const processIPFS = async (cid, config) => {
  const { token, wallet } = config;

  // Step 1: Try PS007 processing first (if we have wallet access)
  // But with timeout and error handling for PSF gateway issues
  if (token && wallet) {
    try {
      const slpMutableData = getSlpMutableData(wallet);

      // Add timeout and error handling for PSF gateway failures
      const ps007Promise = slpMutableData.get.data(token.tokenId);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('PS007 timeout')), 3000)
      );

      const ps007Data = await Promise.race([ps007Promise, timeoutPromise]);

      // Check if we got valid PS007 data with both immutable and mutable data
      if (ps007Data.immutableData && ps007Data.mutableData && ps007Data.mutableData.tokenIcon) {
        const tokenIcon = ps007Data.mutableData.tokenIcon;

        // Validate the original token icon URL
        const tokenIconUrl = await validateUrl(tokenIcon);

        // Optimize the token icon URL using PSF's optimization logic
        let optimizedTokenIcon = optimizeUrl(tokenIcon);
        optimizedTokenIcon = await validateUrl(optimizedTokenIcon);

        // Return the best available icon URL
        const iconUrl = optimizedTokenIcon || tokenIconUrl;

        if (iconUrl) {
          return {
            icon: iconUrl,
            download: true,
            source: 'ps007',
            schema: ps007Data.mutableData.schema || 'ps007',
            tokenStats: ps007Data.tokenStats,
            mutableData: ps007Data.mutableData,
            immutableData: ps007Data.immutableData,
            ps002Compatible: true
          };
        }
      }
    } catch (error) {
      // PS007 processing failed (PSF gateway down, CORS, timeout, etc.)
      // Log the error type for debugging but continue silently
      if (error.message.includes('502') || error.message.includes('CORS') ||
          error.message.includes('fullstack.cash') || error.message.includes('timeout')) {
        // PSF gateway issues - skip to direct IPFS processing
        console.debug('PSF gateway unavailable, using direct IPFS processing');
      }
      // Continue to direct IPFS attempt regardless of error type
    }
  }

  // Step 2: Fallback to direct IPFS content (image or JSON)
  try {
    const bestGateway = await getBestGateway(cid, config);
    if (!bestGateway) {
      return null;
    }

    // Try to fetch the content directly
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout || 3000);

    const response = await fetch(bestGateway.testUrl, {
      signal: controller.signal,
      mode: 'cors',
      headers: {
        'Accept': 'application/json, image/*, */*'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get('content-type') || '';

    // If it's an image, return the URL directly
    if (contentType.startsWith('image/')) {
      return {
        icon: bestGateway.testUrl,
        download: true,
        source: 'ipfs-direct-image'
      };
    }

    // Handle TokenTiger directory listings - try /data.json for directories
    if (contentType.includes('text/html') && bestGateway.testUrl.includes('files.tokentiger.com')) {
      try {
        const dataJsonUrl = `${bestGateway.testUrl}/data.json`;
        const jsonResponse = await fetch(dataJsonUrl, {
          signal: controller.signal,
          mode: 'cors',
          headers: { 'Accept': 'application/json' }
        });

        if (jsonResponse.ok) {
          const data = await jsonResponse.json();

          // Handle PS007 NFT metadata with payloadCid
          if (data.schema && data.schema.startsWith('ps007') && data.payloadCid) {
            // TokenTiger payloadCid images are often not available on IPFS gateways
            // Return placeholder immediately to avoid failed image loads in browser
            return {
              icon: '/token-placeholder.svg',
              download: true,
              source: 'nft-tokentiger-ps007-placeholder',
              metadata: data,
              payloadCid: data.payloadCid,
              note: 'TokenTiger NFT metadata loaded but image not available on IPFS'
            };
          }

          // Handle regular tokenIcon
          if (data.tokenIcon) {
            return {
              icon: data.tokenIcon,
              download: true,
              source: 'tokentiger-json-icon',
              metadata: data
            };
          }
        }
      } catch {
        // JSON fetch failed, continue
      }
    }

    // If it's JSON, try to parse for NFT metadata or direct tokenIcon
    if (contentType.includes('json')) {
      try {
        const data = await response.json();

        // PS007 NFT metadata with payloadCid (TokenTiger NFTs)
        if (data.schema && data.schema.startsWith('ps007') && data.payloadCid) {
          // TokenTiger payloadCid images are consistently unavailable on IPFS gateways
          // Skip time-consuming gateway tests and return placeholder immediately
          return {
            icon: '/token-placeholder.svg',
            download: true,
            source: 'nft-ps007-payload-unavailable',
            metadata: data,
            payloadCid: data.payloadCid,
            note: 'TokenTiger NFT metadata loaded but payloadCid image not available on IPFS'
          };
        }

        // Direct tokenIcon in JSON (for regular tokens)
        if (data.tokenIcon) {
          return {
            icon: data.tokenIcon,
            download: true,
            source: 'ipfs-json-icon'
          };
        }

        // If no specific icon found, return metadata for debugging
        return {
          icon: null,
          metadata: data,
          source: 'ipfs-json-metadata-only'
        };

      } catch {
        // Invalid JSON, continue
      }
    }

    return null;
  } catch {
    // Silent error handling
    return null;
  }
};

const processHTTP = async (url, config) => {
  // Check if domain is known to cause CORS issues
  if (isBlockedDomain(url)) {
    // Silent skip for blocked domains
    return null;
  }

  try {
    // Test if the URL is accessible with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout || 2000);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      mode: 'cors',
      cache: 'no-cache'
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return { icon: url, download: true };
    }

    return null;
  } catch {
    // Silent error handling for CORS and other network issues
    return null;
  }
};

// Process Pouns/Nouns generated SVG icons
const processPouns = async (url, config) => {
  if (!url) return null;

  try {
    const seed = url.replace('(', '[').replace(')', ']');
    const svg = await generatePoun(getContracts(), seed);
    const imgData = Buffer.from(svg, 'base64').toString();

    let icon = imgData;
    if (config.size) {
      icon = imgData.replace(
        '<svg width="320" height="320"',
        `<svg width="${config.size}" height="${config.size}"`
      );
    }

    return { icon, download: false }; // direct display, no download
  } catch {
    return null;
  }
};


// Process PSF tokens using official slp-mutable-data library (PSF-compatible)
const processPSF = async (config) => {
  const { token, wallet } = config;
  if (!token || !wallet) return null;

  try {
    // Get the slp-mutable-data instance for this wallet
    const slpMutableData = getSlpMutableData(wallet);

    // Use the official PSF workflow: get.data() handles all PS002/PS007 complexity
    const data = await slpMutableData.get.data(token.tokenId);

    // Check if this token has PS007 mutable data
    if (!data.mutableData || !data.mutableData.tokenIcon) {
      // This is an older token without mutable data, try centralized icon server
      const iconRepoStr = `https://tokens.bch.sx/250/${token.tokenId}.png`;
      const iconRepoCompatible = await validateUrl(iconRepoStr);

      if (iconRepoCompatible) {
        return {
          icon: iconRepoStr,
          download: true,
          source: 'icon-repo',
          iconRepoCompatible: true,
          ps002Compatible: false
        };
      }

      return null; // No icon found
    }

    // Token has PS007 mutable data - process the tokenIcon
    const tokenIcon = data.mutableData.tokenIcon;

    // Validate the original token icon URL
    const tokenIconUrl = await validateUrl(tokenIcon);

    // Optimize the token icon URL using PSF's optimization logic
    let optimizedTokenIcon = optimizeUrl(tokenIcon);
    optimizedTokenIcon = await validateUrl(optimizedTokenIcon);

    // Return the best available icon URL
    const iconUrl = optimizedTokenIcon || tokenIconUrl;

    if (iconUrl) {
      return {
        icon: iconUrl,
        download: true,
        source: 'ps007',
        schema: data.mutableData.schema || 'ps007',
        tokenStats: data.tokenStats,
        mutableData: data.mutableData,
        immutableData: data.immutableData,
        iconRepoCompatible: false,
        ps002Compatible: true
      };
    }

    return null;

  } catch {
    // Silent error handling - allow fallback to alternatives
    return null;
  }
};

// Process Juungle NFT icons
const processJuungle = async (config) => {
  const { token, wallet } = config;
  if (!token || !wallet) return null;

  try {
    const tokenData = await wallet.getTokenData(token.tokenId);
    const group = tokenData.genesisData.parentGroupId;
    const url = `${JUUNGLE}/${group}/${token.tokenId}`;
    return processHTTP(url, config);
  } catch {
    return null;
  }
};

// Process legacy tokens (blocked due to CORS)
const processLegacy = async () => {
  // Legacy tokens.bch.sx is blocked due to CORS - skip silently
  return null;
};

// Process alternative sources (BCMR, jsDelivr, GitHack, etc.)
const processAlternatives = async (config) => {
  const { token } = config;
  if (!token || !token.tokenId) return null;

  try {
    // Import slpAlternatives dynamically to avoid circular dependencies
    const { getTokenDataFromAlternatives } = await import('./slpAlternatives.js');

    // Try comprehensive alternative data with new 2025 sources
    const altData = await getTokenDataFromAlternatives(token.tokenId);
    if (altData.icon) {
      return altData.icon;
    }

    return null;
  } catch {
    // Silent error handling
    return null;
  }
};

const SlpTokenData = {
  getMedia,
  getBestGateway,
  testGateway,
  extractIPFSHash,
  processAlternatives,
  processPouns,
  processPSF,
  processJuungle,
  processLegacy,
  IPFS_GATEWAYS
};

export default SlpTokenData;