# PSF Wallet

A modern, mobile-first Bitcoin Cash (BCH) wallet built with React and powered by the Permissionless Software Foundation's infrastructure.

## Features

- **Mobile-First Design**: Optimized for mobile devices with touch-friendly interface
- **Complete BCH Support**: Send, receive, and manage Bitcoin Cash
- **SLP Token Support**: Full support for Simple Ledger Protocol tokens
- **Server Management**: Switch between different BCH API servers
- **Wallet Tools**: UTXO optimization, sweeping, and wallet details
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Theme**: Easy on the eyes with accessibility features

## Architecture

This wallet combines:
- **Functionality**: Same BCH/SLP operations from `bch-wallet-kit`
- **Design**: Mobile-first UI patterns from `mainnet-wallet`
- **Blockchain Layer**: Proven `optimized-slp-wallet` integration

## Project Structure

```
psf-wallet/
├── src/
│   ├── components/          # All wallet components (from bch-wallet-kit)
│   │   ├── Layout/         # Mobile layout components
│   │   └── ...             # Wallet functionality components
│   ├── pages/              # Page components (Home, Send, Receive, Tools, Settings)
│   ├── hooks/              # React hooks for wallet operations
│   ├── utils/              # Utility functions
│   ├── styles/             # CSS styles
│   ├── atoms.js            # Jotai state management
│   └── App.jsx             # Main app with routing
├── public/
│   └── minimal-slp-wallet.min.js  # Blockchain library
└── package.json
```

## Development

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy the blockchain library
npm run script

# Start development server
npm run dev
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Server Configuration

The wallet supports multiple BCH API servers:

- **FullStack.cash (Free)**: `https://free-bch.fullstack.cash`
- **FullStack.cash (Paid)**: `https://api.fullstack.cash` (requires API token)
- **PSF Development**: `https://dev-consumer.psfoundation.info`

Custom servers can be added through the Settings page.

## Usage

1. **First Time Setup**:
   - Select a server from the dropdown
   - Enter or generate a mnemonic phrase
   - Connect your wallet

2. **Navigation**:
   - **Home**: View balance and tokens
   - **Send**: Send BCH or tokens
   - **Receive**: Display your address and QR code
   - **Tools**: Advanced wallet features
   - **Settings**: Server management and configuration

3. **Server Management**:
   - Test server connections
   - Switch between servers
   - Add custom servers
   - Monitor connection status

## Key Features

### Mobile-First Design
- Fixed header and bottom navigation
- Touch-friendly buttons (44px minimum)
- Responsive layouts for all screen sizes
- Dark theme with high contrast options

### Server Management
- Real-time connection testing
- Automatic failover
- Custom server support
- Connection status indicators

### Complete BCH Functionality
- HD wallet support (BIP44)
- UTXO optimization
- SLP token management
- Transaction history
- QR code scanning
- Paper wallet sweeping

## Technical Details

### State Management
Uses Jotai atoms for:
- Wallet connection state
- Balance and token data
- Server configuration
- UI notifications

### Blockchain Integration
- Consumer API interface (no REST API needed)
- Compatible with bch-api servers
- Uses optimized-slp-wallet for operations
- Secure key management

### Build System
- Vite for fast development and building
- Crypto polyfills for browser compatibility  
- ESLint for code quality
- Modern React with hooks

## Security

- Private keys never leave the browser
- Mnemonic phrases stored locally only
- HTTPS connections to API servers
- No telemetry or tracking

## Contributing

This wallet is built on top of proven PSF infrastructure. When contributing:

1. Maintain compatibility with existing bch-wallet-kit components
2. Follow mobile-first design principles
3. Test on multiple devices and screen sizes
4. Ensure accessibility compliance

## License

MIT License - see LICENSE file for details

## Support

For issues and support:
- GitHub Issues: [Repository Issues](https://github.com/psf/wallet/issues)
- PSF Community: [PSF Website](https://psfoundation.info)

Built with ❤️ by the Permissionless Software Foundation