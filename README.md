# Frevoke

![Category](https://img.shields.io/badge/Category-Security%20Utility%20%2F%20Base-1f1f1f?style=flat-square&labelColor=141414&color=2b2b2b) ![Status](https://img.shields.io/badge/Status-public-1f1f1f?style=flat-square&labelColor=141414&color=2b2b2b)

Base token approval revoke mini app for inspecting and revoking approvals from a mobile-first UI.

## Links

- Live: https://frevoke.vercel.app
- Repository: https://github.com/yusufky63/frevoke
- Portfolio: https://codexsha.dev

## Overview

Frevoke is part of the Codexsha product portfolio. The project is focused on shipping a compact, usable product surface rather than a demo-only prototype. This README is written to make the repository easier to understand, run, and evaluate.

## Key Features

- Token approval inspection
- Approval revoke transaction flow
- Base Blockscout data integration
- Mobile-first Farcaster interface
- No persistent backend requirement

## Stack

- Next.js
- OnchainKit
- Farcaster SDK
- Wagmi
- Viem
- Axios
- Blockscout

## Role / Ownership

Built the approval inspection UI, revoke transaction flow, wallet integration, and Base-focused utility experience.

## Getting Started

```bash
npm install
npm run dev
npm run build
```

## Environment

Create a local environment file from the project conventions and configure only the values needed for the flow you are running. Do not commit secrets.

Typical values used by this project include:

- Blockscout/API endpoints
- wallet connector configuration
- Farcaster mini app metadata

## Project Notes

- Status: Public repository and live deployment.
- Private or sensitive implementation details are intentionally not documented in public-facing copy.
- The README should stay aligned with the live product and the Codexsha portfolio page.

## Maintainer

Built by Yusuf / Codexsha.

- GitHub: https://github.com/yusufky63
- X: https://x.com/codexsha
- Telegram: https://t.me/codexsha
