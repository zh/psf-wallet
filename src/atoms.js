import { atom } from 'jotai';

// Default server list with capabilities
const DEFAULT_SERVERS = [
  {
    id: 'free-fullstack',
    name: 'FullStack.cash (Free)',
    url: 'https://free-bch.fullstack.cash',
    type: 'free',
    status: 'unknown'
  },
  {
    id: 'paid-fullstack',
    name: 'FullStack.cash (Paid)',
    url: 'https://api.fullstack.cash',
    type: 'paid',
    requiresAuth: true,
    status: 'unknown'
  },
  {
    id: 'psf-dev',
    name: 'PSF Development',
    url: 'https://dev-consumer.psfoundation.info',
    type: 'dev',
    status: 'unknown'
  }
];

// Wallet-kit core atoms (copied from bch-wallet-kit)
export const optionsAtom = atom({
  interface: 'consumer-api',
  restURL: 'https://free-bch.fullstack.cash',
  noUpdate: true,
});
optionsAtom.debugLabel = 'optionsAtom';

export const mnemonicAtom = atom('');
mnemonicAtom.debugLabel = 'mnemonicAtom';

export const walletConnectedAtom = atom(false);
walletConnectedAtom.debugLabel = 'walletConnectedAtom';

// Atom to store the wallet instance
export const walletAtom = atom(null);
walletAtom.debugLabel = 'walletAtom';

export const tokensAtom = atom([]);
tokensAtom.debugLabel = 'tokensAtom';

export const priceAtom = atom(0);
priceAtom.debugLabel = 'priceAtom';

export const balanceAtom = atom(0); // Default balance is 0 (in BCH)
balanceAtom.debugLabel = 'balanceAtom';

// Refresh trigger atoms
export const balanceRefreshTriggerAtom = atom(0);
balanceRefreshTriggerAtom.debugLabel = 'balanceRefreshTriggerAtom';

export const tokensRefreshTriggerAtom = atom(null, (get, set) => {
  set(tokensAtom, get(tokensAtom));
});
tokensRefreshTriggerAtom.debugLabel = 'tokensRefreshTriggerAtom';

export const busyAtom = atom(false);
busyAtom.debugLabel = 'busyAtom';

export const notificationAtom = atom(null);
notificationAtom.debugLabel = 'notificationAtom';

// Atoms for script loading state
export const scriptLoadedAtom = atom(false);
scriptLoadedAtom.debugLabel = 'scriptLoadedAtom';

export const scriptErrorAtom = atom(null);
scriptErrorAtom.debugLabel = 'scriptErrorAtom';

// Custom server management atoms
export const serverListAtom = atom(DEFAULT_SERVERS);
serverListAtom.debugLabel = 'serverListAtom';

export const selectedServerAtom = atom(DEFAULT_SERVERS[0]);
selectedServerAtom.debugLabel = 'selectedServerAtom';

export const serverStatusAtom = atom({});
serverStatusAtom.debugLabel = 'serverStatusAtom';

// Derived atom to sync selected server with options
export const syncServerAtom = atom(
  (get) => get(selectedServerAtom),
  (get, set, newServer) => {
    set(selectedServerAtom, newServer);
    set(optionsAtom, {
      ...get(optionsAtom),
      restURL: newServer.url
    });
  }
);
syncServerAtom.debugLabel = 'syncServerAtom';

// Advanced settings atoms
export const settingsAtom = atom({
});
settingsAtom.debugLabel = 'settingsAtom';


// Manual refresh trigger atoms
export const manualBalanceRefreshAtom = atom(null, (get, set) => {
  const current = get(balanceRefreshTriggerAtom);
  set(balanceRefreshTriggerAtom, current + 1);
});
manualBalanceRefreshAtom.debugLabel = 'manualBalanceRefreshAtom';

