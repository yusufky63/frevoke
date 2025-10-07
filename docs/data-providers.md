# Data Providers: Moralis + Etherscan/Alchemy

This app can fetch wallet token approvals using two strategies:

- Moralis Web3 Data API (preferred on supported chains)
- Etherscan V2 logs + on-chain allowance checks via Alchemy (fallback)

## How it selects a provider

- If `NEXT_PUBLIC_MORALIS_API_KEY` is set and the selected chain is supported by Moralis, the app uses Moralis to fetch current approvals directly.
- Otherwise, it falls back to the existing hybrid approach: discover approval logs via Etherscan/Blockscout and verify current allowances on-chain using Alchemy.

Selection logic lives in `src/hooks/useApprovalsAlchemy.ts` and the Moralis client is at `src/lib/moralis.ts`.

## Environment variables

- `NEXT_PUBLIC_MORALIS_API_KEY` (optional): Enables Moralis provider.
- `NEXT_PUBLIC_ALCHEMY_API_KEY` (optional): Used by the hybrid fallback for metadata and allowance checks.

Note: These variables are client-exposed (NEXT_PUBLIC_) and will be bundled. Do not use production keys you consider private.

## Moralis-supported chains

Currently enabled chain IDs for Moralis in this project:

- 1 (Ethereum Mainnet)
- 11155111 (Ethereum Sepolia)
- 17000 (Ethereum Holesky)
- 137 (Polygon Mainnet)
- 80002 (Polygon Amoy)
- 56 (BSC Mainnet)
- 97 (BSC Testnet)
- 42161 (Arbitrum)
- 421614 (Arbitrum Sepolia)
- 8453 (Base)
- 84532 (Base Sepolia)
- 10 (Optimism)

If a chain is not in this list, the app automatically uses the fallback method.

## Files

- `src/lib/moralis.ts`: Moralis API client and chain support map.
- `src/hooks/useApprovalsAlchemy.ts`: Chooses Moralis or hybrid provider and returns unified `Approval[]`.

