"use client";

import { useState, useEffect } from "react";
import {
  useAccount,
  useSendCalls,
  useChainId,
  useSwitchChain,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits } from "viem";
import type { Approval, TransactionStatus } from "@/lib/types";
import { getChainName } from "@/lib/chain-config";
import { sdk } from "@farcaster/miniapp-sdk";
import { RevokeTracker } from "@/lib/revoke-tracker";

interface UseRevokeReturn {
  revoke: (approvals: Approval[]) => Promise<void>;
  setAllowance: (approval: Approval, amountInput: string) => Promise<void>;
  isRevoking: boolean;
  status: TransactionStatus;
  transactionHash?: string;
  onRevokeSuccess?: (count: number, chainName: string) => void;
}

export function useRevoke(
  targetChainId?: number,
  onRevokeSuccess?: (count: number, chainName: string) => void,
  onEditSuccess?: (txHash: string, chainName: string) => void
): UseRevokeReturn {
  const { address, connector } = useAccount();
  const {
    sendCalls,
    data: sendCallsData,
    error: sendCallsError,
  } = useSendCalls();
  const currentChainId = useChainId();
  const { switchChain } = useSwitchChain();

  const [isRevoking, setIsRevoking] = useState(false);
  const [status, setStatus] = useState<TransactionStatus>({
    status: "PENDING",
  });
  const [lastTxHash, setLastTxHash] = useState<string | undefined>(undefined);
  const [pendingTxHash, setPendingTxHash] = useState<string | undefined>(
    undefined
  );
  const [currentTxHash, setCurrentTxHash] = useState<string | undefined>(
    undefined
  );
  const [isRevokeOperation, setIsRevokeOperation] = useState<boolean>(false);
  const [currentRevokeCount, setCurrentRevokeCount] = useState<number>(0);

  // Use Wagmi's useWaitForTransactionReceipt for better transaction tracking
  const {
    data: receipt,
    error: receiptError,
    isLoading: isReceiptLoading,
  } = useWaitForTransactionReceipt({
    hash: pendingTxHash as `0x${string}` | undefined,
    timeout: 60000, // 60 seconds timeout
    query: {
      enabled: !!pendingTxHash, // Only run when we have a pending hash
      refetchInterval: 2000, // Check every 2 seconds
    },
  });

  // Track sendCallsData changes
  useEffect(() => {
    if (sendCallsData) {
      // Extract transaction hash from sendCallsData
      let transactionHash: string | undefined;

      if (typeof sendCallsData === "string") {
        transactionHash = sendCallsData;
      } else if (
        typeof sendCallsData === "object" &&
        sendCallsData !== null &&
        sendCallsData !== undefined
      ) {
        const resultObj = sendCallsData as Record<string, unknown>;

        // Try all possible hash properties
        const possibleHashes = [
          resultObj?.transactionHash,
          resultObj?.hash,
          resultObj?.txHash,
          resultObj?.id,
          (resultObj?.transaction as Record<string, unknown>)?.hash,
          (resultObj?.receipt as Record<string, unknown>)?.transactionHash,
          resultObj?.tx,
          resultObj?.transactionId,
          resultObj?.txId,
        ];

        transactionHash = possibleHashes.find(
          (hash) =>
            typeof hash === "string" &&
            hash.length > 10 &&
            hash.startsWith("0x")
        ) as string;
      }

      if (transactionHash) {
        // Ensure hash is in correct format for Wagmi
        const formattedHash = transactionHash.startsWith("0x")
          ? (transactionHash as `0x${string}`)
          : (`0x${transactionHash}` as `0x${string}`);

        setStatus({
          status: "PENDING",
          message: "Transaction sent, waiting for confirmation...",
        });

        setTimeout(() => {
          setPendingTxHash(formattedHash);
          setCurrentTxHash(formattedHash);
        }, 100);
      } else {
        setStatus({
          status: "FAILED",
          error: "Transaction failed: No transaction hash returned",
        });
      }
    }
  }, [sendCallsData]);

  // Track sendCallsError changes
  useEffect(() => {
    if (sendCallsError) {
      setStatus({
        status: "FAILED",
        error: `Transaction failed: ${
          sendCallsError.message || sendCallsError
        }`,
      });
    }
  }, [sendCallsError]);

  // Track receipt status with Wagmi
  useEffect(() => {
    if (receipt) {
      if (receipt.status === "success") {
        setStatus({
          status: "CONFIRMED",
          hash: pendingTxHash,
          message: "Transaction confirmed successfully",
        });
        setLastTxHash(pendingTxHash);

        // Call success callback for both revoke and edit operations
        if (pendingTxHash) {
          if (isRevokeOperation && onRevokeSuccess) {
            onRevokeSuccess(currentRevokeCount, getChainName(targetChainId || currentChainId));
          } else if (!isRevokeOperation && onEditSuccess) {
            onEditSuccess(
              pendingTxHash,
              getChainName(targetChainId || currentChainId)
            );
          }
        }

        setPendingTxHash(undefined);
        setCurrentTxHash(undefined);
      } else {
        setStatus({
          status: "FAILED",
          error: "Transaction failed on-chain",
        });
        setPendingTxHash(undefined);
        setCurrentTxHash(undefined);
      }
    }

    if (receiptError) {
      setStatus({
        status: "FAILED",
        error: `Transaction error: ${receiptError.message}`,
      });
      setPendingTxHash(undefined);
      setCurrentTxHash(undefined);
    }
  }, [
    receipt,
    receiptError,
    pendingTxHash,
    currentTxHash,
    onRevokeSuccess,
    onEditSuccess,
    targetChainId,
    currentChainId,
    isRevokeOperation,
    isReceiptLoading,
    currentRevokeCount,
  ]);

  // Helper function to switch chains automatically using Farcaster SDK
  const switchToChain = async (chainId: number) => {
    try {
      // Use Farcaster SDK for chain switching in Mini Apps
      const provider = await sdk.wallet.getEthereumProvider();
      if (provider && provider.request) {
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${chainId.toString(16)}` }],
        });
        return true;
      } else {
        throw new Error("Farcaster provider not available");
      }
    } catch (error) {
      console.error("Farcaster SDK chain switch failed:", error);

      // Fallback to Wagmi if Farcaster fails
      try {
        await switchChain({ chainId });
        return true;
      } catch (wagmiError) {
        console.error("Wagmi fallback also failed:", wagmiError);
        throw new Error(
          `Failed to switch to ${getChainName(
            chainId
          )}. Please switch manually.`
        );
      }
    }
  };

  const revoke = async (approvals: Approval[]) => {
    if (!address || approvals.length === 0) return;

    const revokeCount = approvals.length;

    // Start tracking the revoke operation
    const operationId = RevokeTracker.startTracking(
      targetChainId || currentChainId,
      revokeCount
    );

    setIsRevoking(true);
    setStatus({ status: "PENDING" });
    setIsRevokeOperation(true);
    setCurrentRevokeCount(revokeCount);

    try {
      // Automatically switch to the target chain if needed
      if (targetChainId && currentChainId !== targetChainId) {
        setStatus({
          status: "PENDING",
          message: `Switching to ${getChainName(targetChainId)}...`,
        });

        try {
          await switchToChain(targetChainId);
          // Wait longer for the chain switch to complete
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Verify the switch was successful
        } catch (switchError) {
          console.error("Chain switch failed:", switchError);
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

      // Check wallet connection before proceeding
      if (!address) {
        setStatus({
          status: "FAILED",
          error: "Wallet not connected. Please connect your wallet first.",
        });
        return;
      }

      if (!connector) {
        setStatus({
          status: "FAILED",
          error:
            "No wallet connector found. Please refresh the page and try again.",
        });
        return;
      }

      // Check if we're using Farcaster connector
      const isFarcasterConnector =
        connector?.id === "farcaster" || connector?.type === "farcasterFrame";

      if (isFarcasterConnector) {
        // Use Farcaster SDK directly for Farcaster Mini Apps
        const provider = await sdk.wallet.getEthereumProvider();
        if (!provider) {
          throw new Error("Farcaster provider not available");
        }

        // Send each call individually and wait for all
        const txHashes: string[] = [];
        const finalRevokeCount = revokeCount; // Capture count in closure
        for (let i = 0; i < calls.length; i++) {
          const call = calls[i];
          setStatus({
            status: "PENDING",
            message: `Processing ${i + 1} of ${calls.length}...`,
          });

          const txHash = await provider.request({
            method: "eth_sendTransaction",
            params: [
              {
                to: call.to,
                data: call.data,
                value: `0x${call.value.toString(16)}`,
                from: address,
              },
            ],
          });

          if (txHash) {
            txHashes.push(txHash);
            // Wait a bit between transactions
            if (i < calls.length - 1) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          }
        }

        // Wait for all transactions to be processed
        if (txHashes.length > 0) {
          const lastHash = txHashes[txHashes.length - 1];
          const formattedHash = lastHash.startsWith("0x")
            ? (lastHash as `0x${string}`)
            : (`0x${lastHash}` as `0x${string}`);

          setStatus({
            status: "PENDING",
            message: "Waiting for confirmations...",
          });

          setTimeout(() => {
            setPendingTxHash(formattedHash);
            setCurrentTxHash(formattedHash);
          }, 100);

          // Wait for all to confirm
          setTimeout(async () => {
            setStatus({
              status: "CONFIRMED",
              hash: formattedHash,
              message: "All transactions confirmed successfully",
            });
            setLastTxHash(formattedHash);

            // Call success callback with correct count (use captured variable)
            if (isRevokeOperation && onRevokeSuccess) {
              await onRevokeSuccess(finalRevokeCount, getChainName(targetChainId || currentChainId));
            } else if (!isRevokeOperation && onEditSuccess) {
              onEditSuccess(
                formattedHash,
                getChainName(targetChainId || currentChainId)
              );
            }

            setPendingTxHash(undefined);
            setCurrentTxHash(undefined);
          }, 3000);
        }
      } else {
        // Use Wagmi's sendCalls for other connectors
        await sendCalls({ calls });
      }

      // The result will be handled by useEffect hooks
      // sendCallsData and sendCallsError will be tracked automatically
    } catch (error) {
      console.error("Revoke failed:", error);

      // Enhanced error handling with more specific error messages
      let errorMessage = "Unknown error";
      let errorCode = "UNKNOWN";

      if (error instanceof Error) {
        errorMessage = error.message;

        // EIP-1193 error codes
        if (
          error.message.includes("User rejected") ||
          error.message.includes("4001")
        ) {
          errorMessage = "🚫 Transaction was cancelled by user";
          errorCode = "USER_REJECTED";
        } else if (error.message.includes("ACTION_REJECTED")) {
          errorMessage = "🚫 Transaction was rejected by user";
          errorCode = "ACTION_REJECTED";
        } else if (error.message.includes("insufficient funds")) {
          errorMessage = "❌ Insufficient funds for gas fees";
          errorCode = "INSUFFICIENT_FUNDS";
        } else if (error.message.includes("network")) {
          errorMessage = "🌐 Network error. Please try again.";
          errorCode = "NETWORK_ERROR";
        } else if (error.message.includes("timeout")) {
          errorMessage = "⏰ Transaction timeout. Please try again.";
          errorCode = "TIMEOUT";
        } else if (error.message.includes("revert")) {
          errorMessage = "🔄 Transaction reverted. Please check your inputs.";
          errorCode = "REVERT";
        }
      }

      setStatus({
        status: "FAILED",
        error: errorMessage,
      });

      // Mark operation as failed in tracker with error code
      RevokeTracker.markFailed(operationId, `${errorCode}: ${errorMessage}`);

      // If user rejected, don't throw error - just show failed status
      if (errorCode === "USER_REJECTED" || errorCode === "ACTION_REJECTED") {
        return; // Don't throw, just return
      }
    } finally {
      setIsRevoking(false);
    }
  };

  // Set a custom allowance for an ERC20 approval
  const setAllowance = async (approval: Approval, amountInput: string) => {
    if (!address) return;
    if (approval.type !== "ERC20") {
      setStatus({
        status: "FAILED",
        error: "Only ERC20 allowances can be edited",
      });
      return;
    }

    setIsRevoking(true);
    // Don't show toast for initial pending state
    setStatus({ status: "PENDING" });

    // Mark this as NOT a revoke operation (it's an edit operation)
    setIsRevokeOperation(false);

    try {
      // Automatically switch to the target chain if needed
      if (targetChainId && currentChainId !== targetChainId) {
        setStatus({
          status: "PENDING",
          message: `Switching to ${getChainName(targetChainId)}...`,
        });

        try {
          await switchToChain(targetChainId);
          // Wait longer for the chain switch to complete
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Verify the switch was successful
        } catch (switchError) {
          console.error("Chain switch failed:", switchError);
          throw switchError;
        }
      }

      // Parse amount input
      const input = (amountInput || "").trim().toLowerCase();
      const isUnlimited2 = [
        "max",
        "unlimited",
        "inf",
        "infinite",
        "∞",
      ].includes(input);
      const isUnlimited = ["max", "unlimited", "∞", "inf"].some(
        (k) => input === k
      );

      let valueBigInt: bigint;
      if (isUnlimited || isUnlimited2) {
        valueBigInt = BigInt(
          "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        );
      } else {
        // Empty defaults to zero
        const normalized = input.length === 0 ? "0" : input;
        valueBigInt = parseUnits(
          normalized as `${number}`,
          approval.tokenDecimals
        );
      }

      const valueHex = valueBigInt.toString(16).padStart(64, "0");
      const spenderHex = approval.spender.slice(2).padStart(64, "0");
      const data = `0x095ea7b3${spenderHex}${valueHex}` as `0x${string}`;

      const calls = [
        {
          to: approval.tokenAddress as `0x${string}`,
          data,
          value: 0n,
        },
      ];

      // Check wallet connection before proceeding
      if (!address) {
        setStatus({
          status: "FAILED",
          error: "Wallet not connected. Please connect your wallet first.",
        });
        return;
      }

      if (!connector) {
        setStatus({
          status: "FAILED",
          error:
            "No wallet connector found. Please refresh the page and try again.",
        });
        return;
      }

      // Check if we're using Farcaster connector
      const isFarcasterConnector =
        connector?.id === "farcaster" || connector?.type === "farcasterFrame";

      if (isFarcasterConnector) {
        // Use Farcaster SDK directly for Farcaster Mini Apps
        const provider = await sdk.wallet.getEthereumProvider();
        if (!provider) {
          throw new Error("Farcaster provider not available");
        }

        // Send each call individually using Farcaster SDK
        for (const call of calls) {
          const txHash = await provider.request({
            method: "eth_sendTransaction",
            params: [
              {
                to: call.to,
                data: call.data,
                value: `0x${call.value.toString(16)}`,
                from: address,
              },
            ],
          });

          if (txHash) {
            const formattedHash = txHash.startsWith("0x")
              ? (txHash as `0x${string}`)
              : (`0x${txHash}` as `0x${string}`);

            setStatus({
              status: "PENDING",
              message: "Transaction sent, waiting for confirmation...",
            });

            setTimeout(() => {
              setPendingTxHash(formattedHash);
              setCurrentTxHash(formattedHash);
            }, 100);
          }
        }

        // For Farcaster SDK, we need to manually call the success callback
        setTimeout(async () => {
          setStatus({
            status: "CONFIRMED",
            hash: pendingTxHash,
            message: "Transaction confirmed successfully",
          });
          setLastTxHash(pendingTxHash);

          if (pendingTxHash && !isRevokeOperation && onEditSuccess) {
            onEditSuccess(
              pendingTxHash,
              getChainName(targetChainId || currentChainId)
            );
          }

          setPendingTxHash(undefined);
          setCurrentTxHash(undefined);
        }, 3000);
      } else {
        // Call sendCalls mutation
        await sendCalls({ calls });
      }

      // The result will be handled by useEffect hooks
      // sendCallsData and sendCallsError will be tracked automatically
    } catch (error) {
      setStatus({
        status: "FAILED",
        error:
          error instanceof Error ? error.message : "Failed to set allowance",
      });
    } finally {
      setIsRevoking(false);
    }
  };

  return {
    revoke,
    setAllowance,
    isRevoking,
    status,
    transactionHash: lastTxHash,
  };
}
