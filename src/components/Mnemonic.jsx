import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAtom, useSetAtom } from 'jotai';
import { busyAtom, notificationAtom, mnemonicAtom, walletConnectedAtom, mnemonicCollapsedAtom } from '../atoms';
import { generateMnemonic, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { sanitizeInput, isValidMnemonicFormat } from '../utils/validation';

const Mnemonic = ({ showSave = true, showGenerate = true }) => {
  const [mnemonic, setMnemonic] = useAtom(mnemonicAtom);
  const [walletConnected] = useAtom(walletConnectedAtom);
  const setNotification = useSetAtom(notificationAtom);
  const [busy] = useAtom(busyAtom);
  const [mnemonicCollapsed, setMnemonicCollapsed] = useAtom(mnemonicCollapsedAtom);

  // Load mnemonic from localStorage on component mount
  useEffect(() => {
    const savedMnemonic = localStorage.getItem('mnemonic');
    if (savedMnemonic) {
      setMnemonic(savedMnemonic);
    }
    // Always expand mnemonic section when mnemonic is empty (first access)
    if (!savedMnemonic && !mnemonic) {
      setMnemonicCollapsed(false);
    }
  }, [setMnemonic, mnemonic, setMnemonicCollapsed]);

  const handleGenerate = () => {
    const newMnemonic = generateMnemonic(wordlist);
    setMnemonic(newMnemonic);
    setNotification({ type: 'success', message: 'New mnemonic generated.' });
  };

  const handleSave = () => {
    try {
      const sanitized = sanitizeInput(mnemonic, 'mnemonic');

      if (!sanitized) {
        setNotification({ type: 'error', message: 'Mnemonic cannot be empty.' });
        return;
      }

      if (!isValidMnemonicFormat(sanitized)) {
        setNotification({ type: 'error', message: 'Invalid mnemonic format.' });
        return;
      }

      if (!validateMnemonic(sanitized, wordlist)) {
        setNotification({ type: 'error', message: 'Invalid mnemonic words.' });
        return;
      }

      localStorage.setItem('mnemonic', sanitized);
      setNotification({
        type: 'success',
        message: 'Mnemonic saved successfully.'
      });
    } catch {
      setNotification({
        type: 'error',
        message: 'Failed to save mnemonic. Please try again.'
      });
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset wallet? This deletes all data.')) {
      localStorage.removeItem('mnemonic');
      setMnemonic('');
      setMnemonicCollapsed(false);
      setNotification({ type: 'success', message: 'Mnemonic reset successfully.'});
    }
  };

  const toggleMnemonicCollapsed = () => {
    setMnemonicCollapsed(!mnemonicCollapsed);
  };

  return (
    <div className="mnemonic-container">
      <div
        className="mnemonic-header"
        onClick={toggleMnemonicCollapsed}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleMnemonicCollapsed();
          }
        }}
        tabIndex={0}
        role="button"
        aria-expanded={!mnemonicCollapsed}
        aria-controls="mnemonic-content"
      >
        <span className={`triangle ${mnemonicCollapsed ? 'collapsed' : 'expanded'}`}>
          ▼
        </span>
        <span className="mnemonic-title">Mnemonic</span>
      </div>

      {!mnemonicCollapsed && (
        <div id="mnemonic-content" className="mnemonic-content">
          <div className="mnemonic-input-wrapper">
            <textarea
              id="mnemonic-input"
              value={mnemonic}
              onChange={(e) => setMnemonic(sanitizeInput(e.target.value, 'mnemonic'))}
              className="mnemonic-input"
              disabled={walletConnected || busy}
              rows="4"
            />
          </div>
        </div>
      )}
      <div className="mnemonic-actions">
        {showSave && (
          <>
            <button
              onClick={handleSave}
              className="mnemonic-save-button"
              disabled={walletConnected || busy} // Disable save when wallet is connected
            >
              Save
            </button>
            <button
              onClick={handleReset}
              className="mnemonic-reset-button"
              disabled={walletConnected || busy} // Disable reset when wallet is connected
            >
              Reset
            </button>
          </>
        )}
        {showGenerate && !mnemonic.trim() && (
          <button
            onClick={handleGenerate}
            className="mnemonic-generate-button"
            disabled={walletConnected || busy} // Disable generate when wallet is connected
          >
            Generate
          </button>
        )}
      </div>
    </div>
  );
};

// PropTypes validation
Mnemonic.propTypes = {
  showSave: PropTypes.bool, // Whether to display 'Save', 'Reset' buttons
  showGenerate: PropTypes.bool, // Whether to display 'Generate' button
};

export default Mnemonic;

