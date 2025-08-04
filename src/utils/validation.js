// src/utils/validation.js

/**
 * Comprehensive validation utilities for BCH wallet operations
 * Security-focused validation with sanitization
 */

/**
 * Validate and sanitize user input to prevent XSS and other attacks
 * @param {string} input - Raw user input
 * @param {string} context - Context for validation (e.g., 'address', 'amount')
 * @returns {string} Sanitized input
 */
export const sanitizeInput = (input, context = 'general') => {
  if (typeof input !== 'string') {
    throw new Error(`Invalid input type for ${context}. Expected string.`);
  }

  // Remove control characters and null bytes
  // eslint-disable-next-line no-control-regex
  let sanitized = input.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

  // Remove potentially dangerous HTML/script tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
};

/**
 * Validate BCH address format
 * @param {string} address - BCH address to validate
 * @returns {boolean} True if valid
 */
export const isValidBCHAddress = (address) => {
  if (!address || typeof address !== 'string') {
    return false;
  }

  const sanitized = sanitizeInput(address, 'address');

  // BCH address formats
  const cashAddressRegex = /^bitcoincash:[a-z0-9]{42,62}$/;
  const legacyAddressRegex = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  const slpAddressRegex = /^simpleledger:[a-z0-9]{42,62}$/;

  return cashAddressRegex.test(sanitized) ||
         legacyAddressRegex.test(sanitized) ||
         slpAddressRegex.test(sanitized);
};

/**
 * Validate amount for transactions
 * @param {string|number} amount - Amount to validate
 * @param {string} type - Type of validation ('bch', 'token', 'satoshi')
 * @returns {boolean} True if valid
 */
export const isValidAmount = (amount, type = 'bch') => {
  if (amount === null || amount === undefined || amount === '') {
    return false;
  }

  const numAmount = parseFloat(amount);

  if (isNaN(numAmount) || numAmount <= 0) {
    return false;
  }

  switch (type) {
    case 'bch':
      // BCH has 8 decimal places max, reasonable upper limit
      return numAmount <= 21000000 && /^\d+\.?\d{0,8}$/.test(amount.toString());

    case 'satoshi':
      // Satoshi amounts should be integers
      return Number.isInteger(numAmount) && numAmount > 0 && numAmount <= 2100000000000000;

    case 'token':
      // Token amounts can vary, but should be reasonable
      return numAmount <= 1e15 && /^\d+\.?\d{0,18}$/.test(amount.toString());

    default:
      return false;
  }
};

/**
 * Validate token ID format
 * @param {string} tokenId - Token ID to validate
 * @returns {boolean} True if valid
 */
export const isValidTokenId = (tokenId) => {
  if (!tokenId || typeof tokenId !== 'string') {
    return false;
  }

  const sanitized = sanitizeInput(tokenId, 'tokenId');

  // Token ID should be 64 character hex string
  return /^[a-fA-F0-9]{64}$/.test(sanitized);
};

/**
 * Validate mnemonic phrase
 * @param {string} mnemonic - Mnemonic to validate
 * @returns {boolean} True if valid format
 */
export const isValidMnemonicFormat = (mnemonic) => {
  if (!mnemonic || typeof mnemonic !== 'string') {
    return false;
  }

  const sanitized = sanitizeInput(mnemonic, 'mnemonic');
  const words = sanitized.split(/\s+/);

  // Standard BIP39 mnemonic lengths
  return [12, 15, 18, 21, 24].includes(words.length) &&
         words.every(word => /^[a-z]+$/.test(word));
};

/**
 * Validate transaction ID format
 * @param {string} txid - Transaction ID to validate
 * @returns {boolean} True if valid
 */
export const isValidTxId = (txid) => {
  if (!txid || typeof txid !== 'string') {
    return false;
  }

  const sanitized = sanitizeInput(txid, 'txid');

  // TXID should be 64 character hex string
  return /^[a-fA-F0-9]{64}$/.test(sanitized);
};

/**
 * Validate WIF (Wallet Import Format) private key
 * @param {string} wif - WIF private key to validate
 * @returns {boolean} True if valid WIF format
 */
export const isValidWIF = (wif) => {
  if (!wif || typeof wif !== 'string') {
    return false;
  }

  const sanitized = sanitizeInput(wif, 'wif');

  // WIF should be 51 or 52 characters and start with L, K, or 5
  // L and K are for compressed keys (52 chars)
  // 5 is for uncompressed keys (51 chars)
  return (
    (sanitized.length === 51 && sanitized[0] === '5') ||
    (sanitized.length === 52 && (sanitized[0] === 'L' || sanitized[0] === 'K'))
  ) && /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/.test(sanitized);
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid
 */
export const isValidURL = (url) => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Validate and throw error if validation fails
 * @param {any} value - Value to validate
 * @param {string} errorMessage - Error message to throw
 * @param {Function} validator - Validation function
 */
export const validateOrThrow = (value, errorMessage, validator = (v) => !!v) => {
  if (!validator(value)) {
    throw new Error(errorMessage);
  }
};

/**
 * Rate limiting validator
 * @param {string} key - Unique key for the operation
 * @param {number} maxAttempts - Maximum attempts allowed
 * @param {number} timeWindowMs - Time window in milliseconds
 * @returns {boolean} True if within rate limit
 */
const rateLimitStore = new Map();

export const isWithinRateLimit = (key, maxAttempts = 5, timeWindowMs = 60000) => {
  const now = Date.now();
  const record = rateLimitStore.get(key) || { attempts: 0, firstAttempt: now };

  // Reset if time window has passed
  if (now - record.firstAttempt > timeWindowMs) {
    record.attempts = 1;
    record.firstAttempt = now;
  } else {
    record.attempts++;
  }

  rateLimitStore.set(key, record);

  return record.attempts <= maxAttempts;
};

/**
 * Clean up rate limit store periodically
 */
export const cleanupRateLimit = () => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now - record.firstAttempt > 300000) { // 5 minutes
      rateLimitStore.delete(key);
    }
  }
};

// Auto cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(cleanupRateLimit, 300000);
}