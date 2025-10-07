"use client";

import type { Approval } from "./types";

const MORALIS_API_KEY = process.env.NEXT_PUBLIC_MORALIS_API_KEY || "";

// Supported Moralis networks (by chainId)
const MORALIS_SUPPORTED: Record<number, true> = {
  1: true, // Ethereum Mainnet
  11155111: true, // Ethereum Sepolia
  17000: true, // Ethereum Holesky
  137: true, // Polygon Mainnet
  80002: true, // Polygon Amoy
  56: true, // BSC Mainnet
  97: true, // BSC Testnet
  42161: true, // Arbitrum One
  421614: true, // Arbitrum Sepolia
  8453: true, // Base
  84532: true, // Base Sepolia
  10: true, // Optimism
};

export function isMoralisSupportedChain(chainId: number): boolean {
  return !!MORALIS_SUPPORTED[chainId];
}

function toHexChain(chainId: number): `0x${string}` {
  return (`0x${chainId.toString(16)}`) as `0x${string}`;
}

// Basic formatting aligned to UI expectations (Unlimited detection)
function normalizeAmount(raw: string): { amount: string; formattedAmount?: string } {
  const maxUint256 =
    "115792089237316195423570985008687907853269984665640564039457584007913129639935";
  if (!raw) return { amount: "0" };
  if (raw === maxUint256) return { amount: raw, formattedAmount: "Unlimited" };
  return { amount: raw };
}

export async function getApprovalsFromMoralis(
  address: string,
  chainId: number,
  opts?: { pageSize?: number; pageLimit?: number }
): Promise<Approval[]> {
  if (!address) return [];
  if (!MORALIS_API_KEY) {
    console.warn("[Moralis] Missing API key");
    return [];
  }
  if (!isMoralisSupportedChain(chainId)) {
    console.log(`[Moralis] Chain ${chainId} not supported; skipping`);
    return [];
  }

  const baseUrl = `https://deep-index.moralis.io/api/v2.2/wallets/${address}/approvals`;
  const chainParam = toHexChain(chainId); // Moralis accepts hex chain ids
  const pageSize = Math.max(1, Math.min(100, opts?.pageSize ?? 100));
  const maxPages = Math.max(1, Math.min(10, opts?.pageLimit ?? 5)); // safety cap

  const headers = {
    "X-API-Key": MORALIS_API_KEY,
    "accept": "application/json",
  } as const;

  let cursor: string | null = null;
  let page = 0;
  const out: Approval[] = [];

  try {
    while (page < maxPages) {
      const params = new URLSearchParams({
        chain: chainParam,
        limit: String(pageSize),
      });
      if (cursor) params.set("cursor", cursor);

      const url = `${baseUrl}?${params.toString()}`;
      const res = await fetch(url, { headers });
      if (!res.ok) {
        const text = await res.text();
        console.warn(`[Moralis] ${res.status} ${res.statusText}: ${text}`);
        break;
      }
      const data = await res.json();

      const results = Array.isArray(data?.result) ? data.result : [];
      for (const item of results) {
        try {
          const token = item?.token || {};
          const spender = item?.spender || {};
          const value: string = String(item?.value ?? "0");
          const valueFormatted: string | undefined =
            typeof item?.value_formatted === "string" ? item.value_formatted : undefined;
          const { amount, formattedAmount } = normalizeAmount(value);

          const approval: Approval = {
            id: `moralis-${(token.address || "0x").toLowerCase()}-${(spender.address || "0x").toLowerCase()}`,
            tokenAddress: String(token.address || "0x").toLowerCase(),
            tokenName: token.name || "Unknown Token",
            tokenSymbol: token.symbol || "UNKNOWN",
            tokenDecimals: Number(token.decimals ?? 18),
            spender: String(spender.address || "0x").toLowerCase(),
            spenderName: undefined,
            type: "ERC20",
            allowance: amount,
            amount,
            formattedAmount: formattedAmount || valueFormatted,
            source: "moralis",
            blockNumber: Number(item?.block_number ?? 0),
            transactionHash: String(item?.transaction_hash || ""),
            timestamp: item?.block_timestamp
              ? Date.parse(item.block_timestamp)
              : Date.now(),
            tokenLogo: token.logo || undefined,
            tokenDescription: undefined,
            tokenWebsite: undefined,
            tokenTwitter: undefined,
            tokenDiscord: undefined,
            tokenTelegram: undefined,
            tokenAddressLabel: token.address_label || undefined,
            tokenCurrentBalance: token.current_balance || undefined,
            tokenCurrentBalanceFormatted: token.current_balance_formatted || undefined,
            tokenUsdPrice: token.usd_price || undefined,
            tokenUsdAtRisk: token.usd_at_risk || undefined,
            tokenVerifiedContract: typeof token.verified_contract === 'boolean' ? token.verified_contract : undefined,
            tokenPossibleSpam: typeof token.possible_spam === 'boolean' ? token.possible_spam : undefined,
          };

          out.push(approval);
        } catch (e) {
          console.warn("[Moralis] Error mapping item", e);
        }
      }

      cursor = data?.cursor || null;
      page += 1;
      if (!cursor) break;
    }
  } catch (error) {
    console.error("[Moralis] Fetch error", error);
    return [];
  }

  // Deduplicate by (token, spender)
  const unique = new Map<string, Approval>();
  for (const a of out) unique.set(`${a.tokenAddress}-${a.spender}`, a);

  console.log(`[Moralis] Collected ${out.length} items, unique ${unique.size}`);
  return Array.from(unique.values());
}
