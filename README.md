# Frevoke

Frevoke is a Base approval revoke mini app for inspecting token approvals and revoking risky allowances from a compact Farcaster-ready interface.

The app focuses on a simple security utility: connect a wallet, fetch approvals, review spender/allowance context, and submit revoke transactions.

## Features

- Base token approval inspection.
- Approval revoke transaction flow.
- Blockscout/API-backed approval lookup path.
- Farcaster Mini App and Base mobile-friendly UX.
- Static export/deployment notes for simple hosting.

| Layer | Tools |
| --- | --- |
| Frontend | Next.js, React, TypeScript, Tailwind CSS, Heroicons |
| Base/Web3 | OnchainKit, Wagmi, Viem |
| Farcaster | Farcaster frame SDK, Mini App SDK, Mini App Wagmi Connector |
| Data | Axios, React Query, Blockscout-oriented approval requests |

## Getting Started

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

## Environment

Use `.env.local.example` when present and keep environment-specific values out of commits.

- `NEXT_PUBLIC_URL`
- `NEXT_PUBLIC_ONCHAINKIT_API_KEY`
- `NEXT_PUBLIC_WC_PROJECT_ID`

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start local development. |
| `npm run build` | Build the app. |
| `npm start` | Run the production server. |
| `npm run lint` | Run lint checks. |

## API Endpoints

### `/api/approvals`

Fetches approval data for the connected wallet/address so the UI can display spender, token, and allowance context before a revoke action.

### `/manifest.json`

Serves Farcaster/mini app metadata for platform discovery and embedding.

## Deployment

- Vercel/Next deployment for dynamic routes and API usage.
- Static export can be used when the API strategy is moved to an external provider.
- Farcaster embedding headers and metadata must remain aligned with the production domain.

## Status

- Repository: https://github.com/yusufky63/frevoke
- Live app: https://frevoke.vercel.app
