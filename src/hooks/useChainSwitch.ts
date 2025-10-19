"use client";

import { useCallback } from "react";
import { useSwitchChain } from "wagmi";
import { sdk } from "@farcaster/miniapp-sdk";
import { getChainName } from "@/lib/chain-config";

/**
 * Centralized chain switching hook
 * Tries Farcaster SDK first, falls back to Wagmi
 */
export function useChainSwitch() {
  const { switchChain } = useSwitchChain();

  const switchToChain = useCallback(
    async (chainId: number): Promise<boolean> => {
      try {
        // Try Farcaster SDK first for Mini Apps
        const provider = await sdk.wallet.getEthereumProvider();
        if (provider && provider.request) {
          await provider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${chainId.toString(16)}` }],
          });
          return true;
        }
        throw new Error("Farcaster provider not available");
      } catch (farcasterError) {
        // Fallback to Wagmi
        try {
          await switchChain({ chainId });
          return true;
        } catch (wagmiError) {
          throw new Error(`Failed to switch to ${getChainName(chainId)}`);
        }
      }
    },
    [switchChain]
  );

  return { switchToChain };
}

