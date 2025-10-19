"use client";

import { createPublicClient, http, parseAbi } from "viem";
import { getAlchemyUrl, getChainConfig } from "./chain-config";

// ⚠️ SECURITY WARNING: API keys should be stored in environment variables
// Please set NEXT_PUBLIC_ALCHEMY_API_KEY in your .env.local file
// Never commit API keys to git repositories
const ALCHEMY_API_KEY =
  process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "4uC-e02TgKlmVF9MqqrMN";

export interface OptimizedApproval {
  id: string;
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimals: number;
  spender: string;
  amount: string;
  formattedAmount?: string;
  type: "ERC20" | "ERC721" | "ERC1155";
  source: "alchemy-optimized";
  // Token metadata from Alchemy
  tokenLogo?: string;
  tokenDescription?: string;
  tokenWebsite?: string;
  tokenTwitter?: string;
  tokenDiscord?: string;
  tokenTelegram?: string;
}

/**
 * Alchemy'den token metadata almak için fonksiyon
 */
async function getTokenMetadataFromAlchemy(tokenAddress: string, chainId: number): Promise<{
  logo?: string;
  description?: string;
  website?: string;
  twitter?: string;
  discord?: string;
  telegram?: string;
}> {
  try {
    const chainConfig = getChainConfig(chainId);
    if (!chainConfig) {
      return {};
    }

    const alchemyUrl = getAlchemyUrl(chainId);
    const apiUrl = `${alchemyUrl}/${ALCHEMY_API_KEY}`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "alchemy_getTokenMetadata",
        params: [tokenAddress],
        id: 1
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      // Check for authentication error
      if (response.status === 401 || errorText.includes('Must be authenticated')) {
        console.error(`[AlchemyMetadata] Authentication failed. Check API key: ${ALCHEMY_API_KEY ? 'Key present' : 'No key'}`);
      }
      
      return {};
    }

    const data = await response.json();
    
    if (data.error) {
      return {};
    }
    
    const tokenData = data.result;
    
    if (!tokenData) {
      return {};
    }

    return {
      logo: tokenData.logo,
      description: tokenData.description,
      website: tokenData.website,
      twitter: tokenData.twitter,
      discord: tokenData.discord,
      telegram: tokenData.telegram,
    };
  } catch {
    return {};
  }
}

/**
 * Etherscan + Alchemy hybrid method - En etkili yöntem
 */
export async function getCurrentApprovalsOnly(
  userAddress: string,
  chainId: number
): Promise<OptimizedApproval[]> {
  try {

    // 1. Etherscan'dan approval log'larını al
    const approvalLogs = await getApprovalLogsFromEtherscan(
      userAddress,
      chainId
    );

    if (approvalLogs.length === 0) {
      return [];
    }


    // 2. Unique (token, spender) çiftlerini çıkar
    const uniquePairs = new Map<
      string,
      { tokenAddress: string; spender: string }
    >();

    for (const log of approvalLogs) {
      const key = `${log.tokenAddress}-${log.spender}`;
      if (!uniquePairs.has(key)) {
        uniquePairs.set(key, {
          tokenAddress: log.tokenAddress,
          spender: log.spender,
        });
      }
    }

    const pairs = Array.from(uniquePairs.values());

    // 3. Alchemy ile allowance'ları kontrol et
    const client = createAlchemyClient(chainId);
    const approvals: OptimizedApproval[] = [];

    for (const pair of pairs) {
      try {
        // Token metadata al
        const metadata = await getTokenMetadata(pair.tokenAddress, chainId);

        // Current allowance kontrol et
        const allowance = await client.readContract({
          address: pair.tokenAddress as `0x${string}`,
          abi: parseAbi([
            "function allowance(address owner, address spender) view returns (uint256)",
          ]),
          functionName: "allowance",
          args: [userAddress as `0x${string}`, pair.spender as `0x${string}`],
        });

        const allowanceStr = allowance.toString();

        if (BigInt(allowanceStr) > 0n) {
          // Allowance değerini formatla
          const formattedAmount = formatAllowance(allowanceStr, metadata.decimals);
          
          const approval = {
            id: `hybrid-${pair.tokenAddress}-${pair.spender}`,
            tokenAddress: pair.tokenAddress,
            tokenName: metadata.name,
            tokenSymbol: metadata.symbol,
            tokenDecimals: metadata.decimals,
            spender: pair.spender,
            amount: allowanceStr,
            formattedAmount: formattedAmount,
            type: "ERC20" as const,
            source: "alchemy-optimized" as const,
          };
          approvals.push(approval);
        }
        } catch {
      }
    }

    
    // Token metadata'yı Alchemy'den al
    const approvalsWithMetadata = await Promise.all(
      approvals.map(async (approval) => {
        try {
          const metadata = await getTokenMetadataFromAlchemy(approval.tokenAddress, chainId);
          return {
            ...approval,
            tokenLogo: metadata.logo,
            tokenDescription: metadata.description,
            tokenWebsite: metadata.website,
            tokenTwitter: metadata.twitter,
            tokenDiscord: metadata.discord,
            tokenTelegram: metadata.telegram,
          };
        } catch {
          return approval;
        }
      })
    );
    
    return approvalsWithMetadata;
  } catch (error) {
    console.error("[Hybrid] Error:", error);
    return [];
  }
}

/**
 * Enhanced fetchWithRetry for EtherscanV2 with params object and improved rate limiting
 */
const fetchWithRetryV2 = async (baseUrl: string, params: Record<string, string>, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      // Use different API key on each retry to avoid rate limits
      if (i > 0) {
        params.apikey = getEtherscanApiKey() || "demo"; // Random key
      }

      const response = await fetch(`${baseUrl}?${new URLSearchParams(params)}`);
      const data = await response.json();

      // Check for rate limit errors
      if (
        data?.status === "0" &&
        (data?.message?.toLowerCase().includes("rate limit") ||
          data?.message?.toLowerCase().includes("max calls per sec"))
      ) {
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue;
        } else {
          throw new Error(
            `Rate limit exceeded after ${retries} attempts: ${data.message}`
          );
        }
      }

      // Check for invalid API key errors
      if (
        data?.status === "0" &&
        data?.message === "NOTOK" &&
        (data?.result?.toLowerCase().includes("invalid api key") ||
          data?.result?.includes("#err2"))
      ) {
        if (i < retries - 1) {
          params.apikey = getEtherscanApiKey() || "demo"; // Get new API key immediately
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        } else {
          throw new Error(
            `Invalid API key after ${retries} attempts with different keys: ${data.result}`
          );
        }
      }

      // Check for "No transactions found" - this is a valid response, don't retry
      if (
        data?.status === "0" &&
        (data?.message?.toLowerCase().includes("no transactions found") ||
          data?.result === "No transactions found")
      ) {
        return data; // Return the response as is
      }

      if (data?.result !== undefined) {
        return data;
      }
      throw new Error("Invalid response format");
    } catch (error: unknown) {
      // Handle rate limit errors in catch block as well
      if (
        ((error instanceof Error && 
          (error.message?.toLowerCase().includes("rate limit") ||
           error.message?.toLowerCase().includes("max calls per sec"))) ||
        (error as { status?: number })?.status === 429) &&
        i < retries - 1
      ) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
      }

      // Handle invalid API key errors in catch block
      if (
        (error instanceof Error && error.message?.toLowerCase().includes("invalid api key")) ||
        (error instanceof Error && error.message?.includes("#err2"))
      ) {
        if (i < retries - 1) {
          params.apikey = getEtherscanApiKey() || "demo"; // Get new API key immediately
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
      }

      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      throw error;
    }
  }
};

/**
 * Get approval logs from Etherscan V2 API or Blockscout
 */
async function getApprovalLogsFromEtherscan(
  userAddress: string,
  chainId: number
): Promise<Array<{ tokenAddress: string; spender: string; value: string }>> {
  try {

    // Blockscout kullanan chain'ler
    const blockscoutChains = [666666666, 7777777]; // Degen, Zora
    
    if (blockscoutChains.includes(chainId)) {
      return await getApprovalLogsFromBlockscout(userAddress, chainId);
    }

    // Etherscan V2 API
    const approvalTopic = "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925";
    const ownerTopic = `0x000000000000000000000000${userAddress.slice(2).toLowerCase()}`;

    const params = {
      chainid: chainId.toString(),
      module: "logs",
      action: "getLogs",
      fromBlock: "0",
      toBlock: "latest",
      topic0: approvalTopic,
      topic1: ownerTopic,
      apikey: getEtherscanApiKey() || "demo"
    };

    const data = await fetchWithRetryV2("https://api.etherscan.io/v2/api", params);

    if (data.status !== "1") {
      return [];
    }

    const logs = data.result || [];

    // Log'ları işle
    const approvalLogs = [];
    for (const log of logs) {
      try {
        const tokenAddress = log.address.toLowerCase();
        const spender = "0x" + log.topics[2].slice(26); // topics[2] = spender
        const value = BigInt(log.data).toString();

        approvalLogs.push({
          tokenAddress,
          spender,
          value,
        });
        } catch {
      }
    }

    return approvalLogs;
  } catch (error) {
    console.error("[API] Error fetching logs:", error);
    return [];
  }
}

/**
 * Get approval logs from Blockscout API
 */
async function getApprovalLogsFromBlockscout(
  userAddress: string,
  chainId: number
): Promise<Array<{ tokenAddress: string; spender: string; value: string }>> {
  try {

    const blockscoutUrl = getBlockscoutUrl(chainId);
    if (!blockscoutUrl) {
      return [];
    }

    // Blockscout API - farklı format
    const approvalTopic = "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925";
    const ownerTopic = `0x000000000000000000000000${userAddress.slice(2).toLowerCase()}`;

    const params = {
      module: "logs",
      action: "getLogs",
      fromBlock: "0",
      toBlock: "latest",
      topic0: approvalTopic,
      topic1: ownerTopic,
      topic0_1_opr: "and" // Blockscout için gerekli parametre
    };

    const response = await fetch(`${blockscoutUrl}?${new URLSearchParams(params)}`);
    const data = await response.json();

    if (data.status !== "1") {
      return [];
    }

    const logs = data.result || [];

    // Log'ları işle
    const approvalLogs = [];
    for (const log of logs) {
      try {
        const tokenAddress = log.address.toLowerCase();
        const spender = "0x" + log.topics[2].slice(26); // topics[2] = spender
        const value = BigInt(log.data).toString();

        approvalLogs.push({
          tokenAddress,
          spender,
          value,
        });
      } catch {
      }
    }

    return approvalLogs;
  } catch (error) {
    console.error("[Blockscout] Error fetching logs:", error);
    return [];
  }
}

/**
 * Get API URL for chain - Etherscan or Blockscout
 */

/**
 * Get Blockscout API URL for chain
 */
function getBlockscoutUrl(chainId: number): string | null {
  const urls: Record<number, string> = {
    666666666: "https://explorer.degen.tips/api", // Degen
    7777777: "https://explorer.zora.energy/api", // Zora
  };
  
  return urls[chainId] || null;
}

/**
 * Get Etherscan API key for chain
 * 
 * ⚠️ SECURITY WARNING: API keys should be stored in environment variables
 * These hardcoded keys are for fallback only and should be replaced with:
 * NEXT_PUBLIC_ETHERSCAN_API_KEY_1, NEXT_PUBLIC_ETHERSCAN_API_KEY_2, etc.
 */
function getEtherscanApiKey(): string | null {
  // Try environment variables first
  const envKeys = [
    process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY_1,
    process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY_2,
    process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY_3,
  ].filter(Boolean);

  if (envKeys.length > 0) {
    const randomIndex = Math.floor(Math.random() * envKeys.length);
    return envKeys[randomIndex] as string;
  }

  // ⚠️ FALLBACK ONLY - Replace these with environment variables
  const ETHERSCAN_API_KEYS = [
    "M6Y2NY3ABTV3T4BPNMYZ9X2TP2MAYJTK21",
    "I2ZMSH3H1XF7ZZEYEKEBNY3T2X4K9AJVEW",
    "24Z1CKX9J2AME9ZI1A7SQNAR2QMPCA6IBV",
    "N5D34IBKDQIKPK4EEY32ZI3GRGNS6GRDSX",
    "HFQTE595YJYW46PT99F66BF94M8KSIG8R1",
    "ZBVVZW3162S4MSG19ZCBQW398S4PR7GSCU",
    "J2KE4MYQIVUWCZU5AU5WNFW1978CV89932",
    "TXPBNJ8TVRCNHDSYDA6VX1JPBXQ2KX654J",
  ];

  const randomIndex = Math.floor(Math.random() * ETHERSCAN_API_KEYS.length);
  return ETHERSCAN_API_KEYS[randomIndex];
}

/**
 * Format allowance value for display
 */
function formatAllowance(amount: string, decimals: number): string {
  try {
    const bigIntAmount = BigInt(amount);
    
    // Max uint256 değeri (unlimited approval) - daha kısa versiyonu
    const maxUint256 = BigInt("115792089237316195423570985008687907853269984665640564039457584007913129639935");
    
    // Çok büyük sayıları unlimited olarak kabul et
    if (bigIntAmount >= maxUint256 || bigIntAmount >= BigInt("115792089237316195423570985008687907853269984665640564039457584007913129639900")) {
      return "Unlimited";
    }
    
    // Çok büyük sayıları da unlimited olarak kabul et (praktik olarak unlimited)
    if (bigIntAmount >= BigInt("1000000000000000000000000000")) { // 1e24
      return "Unlimited";
    }
    
    // Daha agresif unlimited detection - çok büyük sayıları unlimited olarak kabul et
    if (bigIntAmount >= BigInt("100000000000000000000000000")) { // 1e23
      return "Unlimited";
    }
    
    // String length ile de kontrol et - çok uzun sayıları kısalt
    if (amount.length > 30) {
      return "Unlimited";
    }
    
    // Çok uzun sayıları kısalt (10-15 karakter göster)
    if (amount.length > 20) {
      const shortAmount = amount.substring(0, 15) + "...";
      return shortAmount;
    }
    
    // Büyük sayıları kısalt
    const divisor = BigInt(10 ** decimals);
    const formatted = Number(bigIntAmount) / Number(divisor);
    
    if (formatted >= 1e12) {
      return `${(formatted / 1e12).toFixed(2)}T`;
    } else if (formatted >= 1e9) {
      return `${(formatted / 1e9).toFixed(2)}B`;
    } else if (formatted >= 1e6) {
      return `${(formatted / 1e6).toFixed(2)}M`;
    } else if (formatted >= 1e3) {
      return `${(formatted / 1e3).toFixed(2)}K`;
    } else if (formatted >= 1) {
      return formatted.toFixed(4);
        } else {
      return formatted.toFixed(8);
    }
          } catch {
    return "Unknown";
  }
}

/**
 * Get token metadata (reused from original)
 */
async function getTokenMetadata(tokenAddress: string, chainId: number) {
  const client = createAlchemyClient(chainId);

  try {
    const [name, symbol, decimals] = await Promise.all([
      client.readContract({
        address: tokenAddress as `0x${string}`,
        abi: parseAbi(["function name() view returns (string)"]),
        functionName: "name",
      }),
      client.readContract({
        address: tokenAddress as `0x${string}`,
        abi: parseAbi(["function symbol() view returns (string)"]),
        functionName: "symbol",
      }),
      client.readContract({
        address: tokenAddress as `0x${string}`,
        abi: parseAbi(["function decimals() view returns (uint8)"]),
        functionName: "decimals",
      }),
    ]);

    return {
      name: name as string,
      symbol: symbol as string,
      decimals: Number(decimals),
    };
    } catch {
    return {
      name: "Unknown Token",
      symbol: "UNKNOWN",
      decimals: 18,
    };
  }
}


/**
 * Create Alchemy client (reused from original)
 */
function createAlchemyClient(chainId: number) {
  const config = getChainConfig(chainId);
  const rpcUrl = `${getAlchemyUrl(chainId)}/${ALCHEMY_API_KEY}`;

  return createPublicClient({
    chain: {
      id: config.id,
      name: config.name,
      nativeCurrency: config.nativeCurrency,
      rpcUrls: {
        default: { http: [config.rpcUrl] },
        public: { http: [config.rpcUrl] },
      },
      blockExplorers: {
        default: { name: "Explorer", url: config.explorerUrl },
      },
      testnet: config.isTestnet,
    },
    transport: http(rpcUrl),
  });
}
