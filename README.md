# Base Revoke Mini App

A minimal Farcaster mini app for revoking token approvals on the Base network. Built with Next.js, OnchainKit, and Tailwind CSS.

## Features

- 🔐 **Wallet Integration**: Connect with Base-compatible wallets
- 🚀 **EIP-5792 Support**: Batch revoke multiple approvals in a single transaction
- 📱 **Mobile-First**: Responsive design optimized for mobile devices
- 🔍 **Real-time Data**: Direct integration with Blockscout API
- 🛡️ **Secure**: No backend database, all data fetched in real-time
- ⚡ **Fast**: Optimized for Base network with minimal dependencies

## Tech Stack

- **Framework**: Next.js 15+ with App Router
- **Styling**: Tailwind CSS
- **Wallet**: OnchainKit + Wagmi
- **Blockchain**: Viem for Ethereum interactions
- **API**: Base Blockscout (no API key required)
- **Deployment**: Static export compatible

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Base-compatible wallet (Coinbase Wallet, MetaMask, etc.)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd revoke-mini
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your configuration:
```env
NEXT_PUBLIC_CHAIN_ID=8453
NEXT_PUBLIC_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_CHAIN_ID` | Base chain ID (8453 for mainnet) | Yes | 8453 |
| `NEXT_PUBLIC_RPC_URL` | Base RPC endpoint | Yes | https://mainnet.base.org |
| `NEXT_PUBLIC_APP_URL` | Your app's public URL | Yes | https://revoke.example.com |
| `NEXT_PUBLIC_ONCHAINKIT_API_KEY` | OnchainKit API key (optional) | No | - |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect project ID (optional) | No | - |
| `NEXT_PUBLIC_FID` | Farcaster FID of the app owner (optional, used in farcaster.json) | No | - |
| `NEXT_PUBLIC_FC_USERNAME` | Farcaster username for owner (optional) | No | - |
| `NEXT_PUBLIC_OWNER_PFP` | Owner profile image URL (optional) | No | `${NEXT_PUBLIC_APP_URL}/icon.png` |

## Usage

1. **Connect Wallet**: Click "Connect Wallet" to connect your Base wallet
2. **View Approvals**: The app automatically fetches your token approvals
3. **Select Approvals**: Check the approvals you want to revoke
4. **Revoke**: Click "Revoke Selected" to revoke approvals
   - If your wallet supports EIP-5792: All approvals revoked in one transaction
   - If not: Individual transactions will be sent

## API Endpoints

### `/api/approvals`
Fetches token approvals for a given address.

**Parameters:**
- `address` (required): Ethereum address
- `chainId` (required): Chain ID (8453 or 84532)

**Example:**
```
GET /api/approvals?address=0x...&chainId=84532
```

### `/manifest.json`
Farcaster mini app manifest.

## Deployment

### Static Export (Recommended)

The app is configured for static export and can be deployed to any static hosting service:

```bash
npm run build
```

The `out/` directory contains the static files.

### Supported Platforms

- **Vercel**: Zero-config deployment
- **Netlify**: Drag and drop the `out/` folder
- **GitHub Pages**: Upload `out/` contents
- **IPFS**: Upload static files for decentralized hosting

### Environment Setup

Make sure to set the following environment variables in your hosting platform:

- `NEXT_PUBLIC_CHAIN_ID`
- `NEXT_PUBLIC_RPC_URL` 
- `NEXT_PUBLIC_APP_URL`

## Farcaster Integration

The app includes Farcaster mini app integration:

- **Manifest**: `/manifest.json` - App metadata
- **Well-known**: `/.well-known/farcaster.json` - Static metadata
- **Icon**: `/icon.png` - App icon (512x512)

Both files are generated at dev/build time from `scripts/generate-farcaster.mjs` using `NEXT_PUBLIC_APP_URL` to ensure absolute URLs required by the Mini Apps validator. Update your environment variables before running.

### Embedding headers

For iFrame embedding inside Farcaster/Warpcast, ensure your host allows framing:

- Netlify: `public/_headers` is included with `frame-ancestors https://*.warpcast.com https://*.farcaster.xyz https://*.miniapps.farcaster.xyz`.
- Other hosts: Configure equivalent headers (CSP `frame-ancestors`) to permit embedding.

## Development

### Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx          # Landing page
│   ├── revoke/           # Main app page
│   ├── api/              # API routes
│   └── manifest.json/    # Farcaster manifest
├── components/           # React components
├── hooks/               # Custom hooks
└── lib/                 # Utilities and types
```

### Key Files

- `src/lib/blockscout.ts` - Blockscout API integration
- `src/lib/eip5792.ts` - EIP-5792 wallet capabilities
- `src/lib/approvals.ts` - Approval encoding logic
- `src/hooks/useApprovals.ts` - Fetch approvals hook
- `src/hooks/useRevoke.ts` - Revoke transactions hook

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation
- Review the code comments

## Security

- No private keys are stored or transmitted
- All transactions are signed locally in your wallet
- No backend database - all data fetched in real-time
- Open source and auditable code
