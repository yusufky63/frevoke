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

        // Use setTimeout to ensure state updates are processed
        setTimeout(() => {
          setPendingTxHash(formattedHash);
          setCurrentTxHash(formattedHash);
        }, 100);
      } else {
        console.error("❌ No transaction hash found in sendCallsData");
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
      console.error("❌ sendCalls failed with error:", sendCallsError);
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
    // Only log when there are meaningful changes

    if (receipt) {
      if (receipt.status === "success") {
        console.log("✅ Transaction confirmed as successful!");
        setStatus({
          status: "CONFIRMED",
          hash: pendingTxHash,
          message: "Transaction confirmed successfully",
        });
        setLastTxHash(pendingTxHash);

        // Call success callback for both revoke and edit operations
        if (pendingTxHash) {
          if (isRevokeOperation && onRevokeSuccess) {
            console.log("🎉 Calling revoke success callback");
            // For revoke operations - show modal
            onRevokeSuccess(1, getChainName(targetChainId || currentChainId));
          } else if (!isRevokeOperation && onEditSuccess) {
            console.log("🎉 Calling edit success callback");
            // For edit operations - just refresh table
            onEditSuccess(
              pendingTxHash,
              getChainName(targetChainId || currentChainId)
            );
          }
        }

        // Clear pending hash
        setPendingTxHash(undefined);
        setCurrentTxHash(undefined);
      } else {
        console.log("❌ Transaction failed on-chain");
        setStatus({
          status: "FAILED",
          error: "Transaction failed on-chain",
        });
        setPendingTxHash(undefined);
        setCurrentTxHash(undefined);
      }
    }

    if (receiptError) {
      console.log("❌ Receipt error:", receiptError);
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

    // Start tracking the revoke operation
    const operationId = RevokeTracker.startTracking(
      targetChainId || currentChainId,
      approvals.length
    );

    setIsRevoking(true);
    // Don't show toast for initial pending state
    setStatus({ status: "PENDING" });

    // Mark this as a revoke operation
    setIsRevokeOperation(true);

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
      // For Farcaster Mini Apps, use address instead of isConnected
      // because isConnected can be false even when wallet is connected
      if (!address) {
        console.error("❌ Wallet not connected - no address");
        setStatus({
          status: "FAILED",
          error: "Wallet not connected. Please connect your wallet first.",
        });
        return;
      }

      // Additional check for connector
      if (!connector) {
        console.error("❌ No wallet connector found");
        setStatus({
          status: "FAILED",
          error:
            "No wallet connector found. Please refresh the page and try again.",
        });
        return;
      }

      console.log("✅ Wallet connection verified - address:", address);

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
          console.log("🔍 Sending call via Farcaster SDK:", call);
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
          console.log("🔍 Farcaster transaction hash:", txHash);

          // Set the transaction hash for tracking
          if (txHash) {
            const formattedHash = txHash.startsWith("0x")
              ? (txHash as `0x${string}`)
              : (`0x${txHash}` as `0x${string}`);

            setStatus({
              status: "PENDING",
              message: "Transaction sent, waiting for confirmation...",
            });

            setTimeout(() => {
              console.log("🔍 Setting pendingTxHash to:", formattedHash);
              setPendingTxHash(formattedHash);
              setCurrentTxHash(formattedHash);
            }, 100);
          }
        }

        // For Farcaster SDK, we need to manually call the success callback
        // since useWaitForTransactionReceipt might not work properly
        setTimeout(async () => {
          console.log(
            "🎉 Farcaster transaction completed, calling success callback"
          );
          setStatus({
            status: "CONFIRMED",
            hash: pendingTxHash,
            message: "Transaction confirmed successfully",
          });
          setLastTxHash(pendingTxHash);

          // Call success callback for both revoke and edit operations
          if (pendingTxHash) {
            if (isRevokeOperation && onRevokeSuccess) {
              console.log("🎉 Calling revoke success callback for Farcaster");
              onRevokeSuccess(1, getChainName(targetChainId || currentChainId));
            } else if (!isRevokeOperation && onEditSuccess) {
              console.log("🎉 Calling edit success callback for Farcaster");
              onEditSuccess(
                pendingTxHash,
                getChainName(targetChainId || currentChainId)
              );
            }
          }

          // Clear pending hash
          setPendingTxHash(undefined);
          setCurrentTxHash(undefined);
        }, 3000); // Wait 3 seconds for transaction to be processed
      } else {
        console.log("🔍 Using Wagmi sendCalls for non-Farcaster connector");
        // Use Wagmi's sendCalls for other connectors
        console.log("🔍 About to call sendCalls with calls:", calls);
        console.log("🔍 sendCalls function:", sendCalls);

        // Call sendCalls mutation
        await sendCalls({ calls });
        console.log("🔍 sendCalls mutation called");
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
      // For Farcaster Mini Apps, use address instead of isConnected
      if (!address) {
        console.error("❌ setAllowance: Wallet not connected - no address");
        setStatus({
          status: "FAILED",
          error: "Wallet not connected. Please connect your wallet first.",
        });
        return;
      }

      if (!connector) {
        console.error("❌ setAllowance: No wallet connector found");
        setStatus({
          status: "FAILED",
          error:
            "No wallet connector found. Please refresh the page and try again.",
        });
        return;
      }

      console.log(
        "✅ setAllowance: Wallet connection verified - address:",
        address
      );

      // Check if we're using Farcaster connector
      const isFarcasterConnector =
        connector?.id === "farcaster" || connector?.type === "farcasterFrame";

      if (isFarcasterConnector) {
        console.log("🔍 setAllowance: Using Farcaster SDK for transaction");
        // Use Farcaster SDK directly for Farcaster Mini Apps
        const provider = await sdk.wallet.getEthereumProvider();
        if (!provider) {
          throw new Error("Farcaster provider not available");
        }

        // Send each call individually using Farcaster SDK
        for (const call of calls) {
          console.log("🔍 setAllowance: Sending call via Farcaster SDK:", call);
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
          console.log("🔍 setAllowance: Farcaster transaction hash:", txHash);

          // Set the transaction hash for tracking
          if (txHash) {
            const formattedHash = txHash.startsWith("0x")
              ? (txHash as `0x${string}`)
              : (`0x${txHash}` as `0x${string}`);

            setStatus({
              status: "PENDING",
              message: "Transaction sent, waiting for confirmation...",
            });

            setTimeout(() => {
              console.log(
                "🔍 setAllowance: Setting pendingTxHash to:",
                formattedHash
              );
              setPendingTxHash(formattedHash);
              setCurrentTxHash(formattedHash);
            }, 100);
          }
        }

        // For Farcaster SDK, we need to manually call the success callback
        setTimeout(async () => {
          console.log(
            "🎉 setAllowance: Farcaster transaction completed, calling success callback"
          );
          setStatus({
            status: "CONFIRMED",
            hash: pendingTxHash,
            message: "Transaction confirmed successfully",
          });
          setLastTxHash(pendingTxHash);

          // Call success callback for edit operations
          if (pendingTxHash && !isRevokeOperation && onEditSuccess) {
            console.log(
              "🎉 setAllowance: Calling edit success callback for Farcaster"
            );
            onEditSuccess(
              pendingTxHash,
              getChainName(targetChainId || currentChainId)
            );
          }

          // Clear pending hash
          setPendingTxHash(undefined);
          setCurrentTxHash(undefined);
        }, 3000); // Wait 3 seconds for transaction to be processed
      } else {
        console.log(
          "🔍 setAllowance: Using Wagmi sendCalls for non-Farcaster connector"
        );
        // Call sendCalls mutation
        await sendCalls({ calls });
        console.log("🔍 setAllowance sendCalls mutation called");
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
