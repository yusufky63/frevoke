"use client";

import { useState } from "react";
import { useAccount, useSendCalls, useChainId, useSwitchChain } from "wagmi";
import { parseUnits } from "viem";
import type { Approval, TransactionStatus } from "@/lib/types";
import { getChainName } from "@/lib/chain-config";
import { sdk } from '@farcaster/miniapp-sdk';

interface UseRevokeReturn {
  revoke: (approvals: Approval[]) => Promise<void>;
  setAllowance: (approval: Approval, amountInput: string) => Promise<void>;
  isRevoking: boolean;
  status: TransactionStatus;
  transactionHash?: string;
}

export function useRevoke(targetChainId?: number): UseRevokeReturn {
  const { address } = useAccount();
  const { sendCalls } = useSendCalls();
  const currentChainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [isRevoking, setIsRevoking] = useState(false);
  const [status, setStatus] = useState<TransactionStatus>({
    status: "PENDING",
  });
  const [lastTxHash, setLastTxHash] = useState<string | undefined>(undefined);

  // Helper function to switch chains automatically using Farcaster SDK
  const switchToChain = async (chainId: number) => {
    try {
      console.log(`Attempting to switch to chain ${chainId} (${getChainName(chainId)})`);
      
      // Use Farcaster SDK for chain switching in Mini Apps
      const provider = await sdk.wallet.getEthereumProvider();
      if (provider && provider.request) {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${chainId.toString(16)}` }],
        });
        console.log(`Successfully switched to chain ${chainId}`);
        return true;
      } else {
        throw new Error('Farcaster provider not available');
      }
    } catch (error) {
      console.error('Farcaster SDK chain switch failed:', error);
      
      // Fallback to Wagmi if Farcaster fails
      try {
        console.log('Trying Wagmi fallback...');
        await switchChain({ chainId });
        return true;
      } catch (wagmiError) {
        console.error('Wagmi fallback also failed:', wagmiError);
        throw new Error(`Failed to switch to ${getChainName(chainId)}. Please switch manually.`);
      }
    }
  };

  const revoke = async (approvals: Approval[]) => {
    if (!address || approvals.length === 0) return;

    setIsRevoking(true);
    // Don't show toast for initial pending state
    setStatus({ status: "PENDING" });

    try {
      // Automatically switch to the target chain if needed
      if (targetChainId && currentChainId !== targetChainId) {
        console.log(`Current chain: ${currentChainId}, Target chain: ${targetChainId}`);
        setStatus({ status: "PENDING", message: `Switching to ${getChainName(targetChainId)}...` });
        
        try {
          await switchToChain(targetChainId);
          // Wait longer for the chain switch to complete
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Verify the switch was successful
          console.log(`Chain switch completed. Current chain: ${currentChainId}`);
        } catch (switchError) {
          console.error('Chain switch failed:', switchError);
          throw switchError;
        }
      }

      // Create calls for each approval
      const calls = approvals.map((approval) => {
        let data: string;

        if (approval.type === "ERC20") {
          // ERC20 approve with 0 amount
          data = `0x095ea7b3${approval.spender
            .slice(2)
            .padStart(64, "0")}${"0".padStart(64, "0")}`;
        } else if (approval.type === "ERC721") {
          // ERC721 setApprovalForAll with false
          data = `0xa22cb465${approval.spender
            .slice(2)
            .padStart(64, "0")}${"0".padStart(64, "0")}`;
        } else if (approval.type === "ERC1155") {
          // ERC1155 setApprovalForAll with false
          data = `0xa22cb465${approval.spender
            .slice(2)
            .padStart(64, "0")}${"0".padStart(64, "0")}`;
        } else {
          throw new Error(`Unsupported approval type: ${approval.type}`);
        }

        return {
          to: approval.tokenAddress as `0x${string}`,
          data: data as `0x${string}`,
          value: 0n,
        };
      });

      console.log("Sending revoke calls:", calls);

      // Use Wagmi's sendCalls for Farcaster Mini App compatibility
      const result = await sendCalls({ calls });

      console.log("Transaction sent:", result);

      // Extract transaction hash from result
      const resultObj = result as unknown as Record<string, unknown>;
      const transactionHash = String(
        resultObj?.transactionHash || resultObj?.hash || result
      );

      setStatus({
        status: "CONFIRMED",
        hash: transactionHash,
      });
      setLastTxHash(transactionHash);
    } catch (error) {
      console.error("Revoke failed:", error);
      setStatus({
        status: "FAILED",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsRevoking(false);
    }
  };

  // Set a custom allowance for an ERC20 approval
  const setAllowance = async (approval: Approval, amountInput: string) => {
    if (!address) return;
    if (approval.type !== "ERC20") {
      setStatus({ status: "FAILED", error: "Only ERC20 allowances can be edited" });
      return;
    }

    setIsRevoking(true);
    // Don't show toast for initial pending state
    setStatus({ status: "PENDING" });

    try {
      // Automatically switch to the target chain if needed
      if (targetChainId && currentChainId !== targetChainId) {
        console.log(`Current chain: ${currentChainId}, Target chain: ${targetChainId}`);
        setStatus({ status: "PENDING", message: `Switching to ${getChainName(targetChainId)}...` });
        
        try {
          await switchToChain(targetChainId);
          // Wait longer for the chain switch to complete
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Verify the switch was successful
          console.log(`Chain switch completed. Current chain: ${currentChainId}`);
        } catch (switchError) {
          console.error('Chain switch failed:', switchError);
          throw switchError;
        }
      }

      // Parse amount input
      const input = (amountInput || "").trim().toLowerCase();
      const isUnlimited2 = ["max","unlimited","inf","infinite","∞"].includes(input);
      const isUnlimited = ["max", "unlimited", "∞", "inf"]
        .some(k => input === k);

      let valueBigInt: bigint;
      if (isUnlimited || isUnlimited2) {
        valueBigInt = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
      } else {
        // Empty defaults to zero
        const normalized = input.length === 0 ? "0" : input;
        valueBigInt = parseUnits(normalized as `${number}`, approval.tokenDecimals);
      }

      const valueHex = valueBigInt.toString(16).padStart(64, "0");
      const spenderHex = approval.spender.slice(2).padStart(64, "0");
      const data = `0x095ea7b3${spenderHex}${valueHex}` as `0x${string}`;

      const calls = [{
        to: approval.tokenAddress as `0x${string}`,
        data,
        value: 0n,
      }];

      const result = await sendCalls({ calls });

      const resultObj = result as unknown as Record<string, unknown>;
      const transactionHash = String(
        resultObj?.transactionHash || resultObj?.hash || result
      );

      setStatus({ status: "CONFIRMED", hash: transactionHash });
      setLastTxHash(transactionHash);
    } catch (error) {
      setStatus({
        status: "FAILED",
        error: error instanceof Error ? error.message : "Failed to set allowance",
      });
    } finally {
      setIsRevoking(false);
    }
  }

  return {
    revoke,
    setAllowance,
    isRevoking,
    status,
    transactionHash: lastTxHash,
  };
}
