# Frevoke

Frevoke is a Base-focused token approval inspection and revoke tool built as a mobile-first Farcaster Mini App.

## Snapshot

- **Category:** Base token approval revoke mini app
- **Status:** Public repository
- **Live:** https://frevoke.vercel.app
- **Repository:** https://github.com/yusufky63/frevoke
- **Portfolio:** https://codexsha.dev

## Product Scope

Frevoke is documented here as a product repository, not just a code dump. The goal of this README is to make the product purpose, runtime surface, and development path clear for future review and maintenance.

## Core Capabilities

- Token approval inspection
- Approval revoke transaction flow
- Base Blockscout data integration
- Mobile-first Farcaster interface
- No persistent backend requirement for the core flow

## Existing README Coverage Preserved

This refresh keeps the important project-specific areas from the previous documentation:

- Features
- Tech Stack
- Getting Started
- Environment Variables
- Usage
- API Endpoints
- /api/approvals
- /manifest.json
- Deployment

## Tech Stack

- Next.js
- OnchainKit
- Farcaster SDK
- Wagmi
- Viem
- Axios
- Blockscout

## Repository Map

| Path | Purpose |
| --- | --- |
| src/app/api/approvals | Approval lookup endpoint |
| src/app/manifest.json | Mini app manifest route |
| src/components/ | Approval and wallet UI |
| public/assets/ | Chain and app assets |

## Local Development

| Command | Purpose |
| --- | --- |
| npm run dev | Run development server |
| npm run build | Build production app |
| npm run start | Start production server |
| npm run lint | Run lint checks |

## Environment Notes

Use local environment files for secrets and deployment-specific values. Do not commit real keys.

- Blockscout/API endpoints
- Wallet connector configuration
- Farcaster mini app metadata

## Operational Notes

- Keep this README aligned with the live product and portfolio copy.
- Prefer small, documented changes over large undocumented rewrites.
- The old README had useful endpoint notes; this version keeps those concepts while tightening the layout.

## Maintainer

Built by Yusuf / Codexsha.

- GitHub: https://github.com/yusufky63
- X: https://x.com/codexsha
- Telegram: https://t.me/codexsha
