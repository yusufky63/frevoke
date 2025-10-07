"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { useApprovalsAlchemy } from "@/hooks/useApprovalsAlchemy";
import { useRevoke } from "@/hooks/useRevoke";
import { useWalletStatus } from "@/hooks/useWalletStatus";
import type { Approval } from "@/lib/types";
import { ConnectButton } from "@/components/ConnectButton";
import { TransactionStatus } from "@/components/TransactionStatus";
import { BatchOperations } from "@/components/BatchOperations";
import { WalletChainSelector } from "@/components/WalletChainSelector";
import { TokenApprovalsTable } from "@/components/TokenApprovalsTable";
import { Pagination } from "@/components/Pagination";
import { getChainName } from "@/lib/chain-config";
import { sdk } from "@farcaster/miniapp-sdk";
import {
  SunIcon,
  MoonIcon,
  XMarkIcon,
  CheckCircleIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";

export default function HomePage() {
  const { address } = useAccount();
  const { switchChain } = useSwitchChain();
  const [isDark, setIsDark] = useState(false);
  const walletStatus = useWalletStatus();

  // More reliable connection check - address varsa connected say
  const isWalletConnected = !!address;

  // Unified loading state for scan operations
  const [isScanning, setIsScanning] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Pagination calculations will be moved after filteredApprovals is set
  const [selectedChainId, setSelectedChainId] = useState<number>(8453); // Default to Base
  const currentChainId = useChainId();

  // Auto switch chain function
  const autoSwitchChain = useCallback(
    async (chainId: number) => {
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
      } catch (err) {
        console.error("Farcaster SDK chain switch failed:", err);

        // Fallback to Wagmi if Farcaster fails
        try {
          await switchChain({ chainId });

          return true;
        } catch (wagmiError) {
          console.error("[HomePage] Wagmi fallback also failed:", wagmiError);
          throw new Error(`Failed to switch to ${getChainName(chainId)}`);
        }
      }
    },
    [switchChain]
  );

  // Use only optimized version for fast performance
  const {
    approvals,
    error: approvalsError,
    refetch,
  } = useApprovalsAlchemy(selectedChainId);

  const [selectedApprovals, setSelectedApprovals] = useState<string[]>([]);
  const [filteredApprovals, setFilteredApprovals] = useState<Approval[]>([]);
  const [editingApprovalId, setEditingApprovalId] = useState<string | null>(
    null
  );
  const [editValue, setEditValue] = useState<string>("");
  const [inputError, setInputError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [lastRevokeCount, setLastRevokeCount] = useState<number>(0);
  const [lastRevokeChain, setLastRevokeChain] = useState<string>("");

  const { revoke, setAllowance, status, transactionHash, isRevoking } =
    useRevoke(
      selectedChainId,
      async (count, chainName) => {
        // Revoke success callback - show modal
        console.log("🎉 Revoke success callback triggered!");
        console.log("🔍 count:", count);
        console.log("🔍 chainName:", chainName);
        
        setLastRevokeCount(count);
        setLastRevokeChain(chainName);

        // Show modal immediately
        if (count > 0) {
          console.log("✅ Showing success modal for revoke operation");
          setShowShareModal(true);
        }

        // Trigger auto-scan after successful revoke
        await handleAutoScan();
      },
      async (txHash, chainName) => {
        // Edit success callback - just refresh table
        console.log(`✅ Edit successful: ${txHash} on ${chainName}`);

        // Trigger auto-scan after successful edit
        await handleAutoScan();
      }
    );

  // Edit functions
  const beginEdit = (approval: Approval) => {
    setEditingApprovalId(approval.id);
    // Show decimal value instead of raw allowance
    setEditValue(formatAllowanceForEdit(approval));
    setInputError("");
  };

  const cancelEdit = () => {
    setEditingApprovalId(null);
    setEditValue("");
    setInputError("");
  };

  // Handle input change with validation
  const handleInputChange = (value: string, decimals: number) => {
    setEditValue(value);
    const validation = validateInput(value, decimals);
    setInputError(validation.error);
  };

  // Format balance helper
  const formatBalance = (approval: Approval) => {
    if (approval.tokenCurrentBalanceFormatted) {
      return approval.tokenCurrentBalanceFormatted;
    }
    if (approval.tokenCurrentBalance) {
      try {
        const balance = Number(approval.tokenCurrentBalance);
        if (balance === 0) return "0";
        if (balance < 0.000001) return "< 0.000001";
        return balance.toFixed(6);
      } catch {
        return approval.tokenCurrentBalance;
      }
    }
    return null;
  };

  // Format allowance helper - convert from wei to decimal
  const formatAllowance = (approval: Approval) => {
    if (approval.allowance === "0") return "0";

    // Check if it's a very large number (like 1111111111111...)
    const allowance = approval.allowance;
    if (allowance.length > 15 || allowance.includes("1111111111111")) {
      return "Unlimited";
    }

    try {
      // Convert from wei to decimal
      const weiValue = BigInt(allowance);
      const divisor = BigInt(Math.pow(10, approval.tokenDecimals));
      const decimalValue = Number(weiValue) / Number(divisor);

      // Format the decimal value nicely
      if (decimalValue === 0) return "0";
      if (decimalValue < 0.000001) return "< 0.000001";
      if (decimalValue >= 1000000) {
        return decimalValue.toExponential(2);
      }
      return decimalValue.toFixed(6).replace(/\.?0+$/, "");
    } catch {
      return allowance;
    }
  };

  // Format allowance for editing - shows decimal value for editing
  const formatAllowanceForEdit = (approval: Approval) => {
    if (approval.allowance === "0") return "0";

    // Check if it's a very large number (like 1111111111111...)
    const allowance = approval.allowance;
    if (allowance.length > 15 || allowance.includes("1111111111111")) {
      return "unlimited";
    }

    try {
      // Convert from wei to decimal
      const weiValue = BigInt(allowance);
      const divisor = BigInt(Math.pow(10, approval.tokenDecimals));
      const decimalValue = Number(weiValue) / Number(divisor);

      // Format the decimal value for editing (no special formatting)
      if (decimalValue === 0) return "0";
      return decimalValue.toString();
    } catch {
      return allowance;
    }
  };

  // Format decimal example helper
  const formatDecimalExample = (decimals: number) => {
    // Format the wei value to be more readable
    if (decimals >= 18) {
      return `1 = 1e18 wei`;
    } else if (decimals >= 6) {
      return `1 = 1e${decimals} wei`;
    } else {
      return `1 = ${Math.pow(10, decimals).toLocaleString()} wei`;
    }
  };

  // Validate input for decimal handling
  const validateInput = (value: string, decimals: number) => {
    const trimmed = value.trim().toLowerCase();

    // Allow special keywords
    if (["max", "unlimited", "∞", "inf", "infinite"].includes(trimmed)) {
      return { isValid: true, error: "" };
    }

    // Allow empty (will be treated as 0)
    if (trimmed === "") {
      return { isValid: true, error: "" };
    }

    // Check if it's a valid number
    const num = parseFloat(trimmed);
    if (isNaN(num)) {
      return { isValid: false, error: "Invalid number format" };
    }

    // Check if it's negative
    if (num < 0) {
      return { isValid: false, error: "Amount cannot be negative" };
    }

    // Check decimal places
    const decimalPlaces = (trimmed.split(".")[1] || "").length;
    if (decimalPlaces > decimals) {
      return {
        isValid: false,
        error: `Maximum ${decimals} decimal places allowed`,
      };
    }

    return { isValid: true, error: "" };
  };

  // Copy to clipboard function
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Show a simple success message
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  // Farcaster Mini App functions
  const handleAddMiniApp = async () => {
    try {
      await sdk.actions.addMiniApp();
    } catch (error) {
      console.error("Failed to add Mini App:", error);
      // Don't show error to user - this is expected for some users
    }
  };

  const handleComposeCast = async () => {
    try {
      const chainName = getChainName(selectedChainId);
      const text = ` Just secured my wallet by revoking ${lastRevokeCount} token approvals on ${chainName}! 

Using @fRevoke to keep my crypto safe 🛡️

#fRevoke`;

      const result = await sdk.actions.composeCast({
        text,
        embeds: [window.location.href],
      });

      if (result?.cast) {
      }

      setShowShareModal(false);
      // Reset revoke count after sharing
      setLastRevokeCount(0);
      setLastRevokeChain("");

      // Refresh table after sharing
      handleAutoScan();
    } catch (error) {
      console.error("Failed to compose cast:", error);
    }
  };

  // Auto add Mini App on page load
  useEffect(() => {
    const autoAddMiniApp = async () => {
      try {
        // Wait a bit for the app to be ready
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await handleAddMiniApp();
      } catch {
        // Silently fail - this is expected for some users
      }
    };

    autoAddMiniApp();
  }, []); // Only run once on mount

  // Auto switch to selected chain on page load
  useEffect(() => {
    const performAutoSwitch = async () => {
      if (
        isWalletConnected &&
        selectedChainId &&
        currentChainId !== selectedChainId
      ) {
        try {
          await autoSwitchChain(selectedChainId);
        } catch (error) {
          console.error("[HomePage] Auto switch on page load failed:", error);
        }
      }
    };

    // Wait a bit for wallet to be ready
    const timer = setTimeout(performAutoSwitch, 1000);
    return () => clearTimeout(timer);
  }, [isWalletConnected, selectedChainId, currentChainId, autoSwitchChain]);

  // Dark mode toggle
  useEffect(() => {
    const initializeTheme = () => {
      const savedTheme = localStorage.getItem("theme");
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;

      let shouldBeDark = false;

      if (savedTheme === "dark") {
        shouldBeDark = true;
      } else if (savedTheme === "light") {
        shouldBeDark = false;
      } else {
        // No saved theme, use system preference
        shouldBeDark = prefersDark;
      }

      setIsDark(shouldBeDark);

      if (shouldBeDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    // Initialize theme
    initializeTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const savedTheme = localStorage.getItem("theme");
      if (!savedTheme) {
        // Only update if no saved preference
        initializeTheme();
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);

    if (newTheme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // Initialize filtered approvals and handle search
  useEffect(() => {
    if (approvals) {
      let filtered = [...approvals];

      // Apply search filter
      if (searchTerm) {
        filtered = filtered.filter(
          (approval) =>
            approval.tokenName
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            approval.tokenSymbol
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            approval.tokenAddress
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            approval.spender.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setFilteredApprovals(filtered);
    }
  }, [approvals, searchTerm]);

  // Auto-scan after revoke operations
  const handleAutoScan = useCallback(async () => {
    setIsScanning(true);

    try {
      // Wait a bit for transaction to be processed
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Force refresh to get updated data
      await refetch();
    } catch (error) {
      console.error("❌ Auto-scan failed:", error);
    } finally {
      setIsScanning(false);
    }
  }, [refetch]);

  // Clear table when chain changes - NO AUTO SCAN
  useEffect(() => {
    // Clear all UI state when chain changes
    setSelectedApprovals([]);
    setFilteredApprovals([]);
    setCurrentPage(1);
    setSearchTerm(""); // Clear search when chain changes
    setEditingApprovalId(null);
    setEditValue("");
    setInputError("");

    // NO AUTO SCAN - let user manually scan when needed
    if (isWalletConnected && selectedChainId) {
    }
  }, [selectedChainId, isWalletConnected]);

  // Clear editing state when transaction is confirmed
  useEffect(() => {
    if (status?.status === "CONFIRMED") {
      // Clear editing state
      setEditingApprovalId(null);
      setEditValue("");
      setInputError("");
    }
  }, [status?.status]);

  // Pagination calculations
  const totalPages = Math.ceil((filteredApprovals?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentApprovals = (filteredApprovals || []).slice(
    startIndex,
    endIndex
  );

  const handleScan = async () => {
    setIsScanning(true);

    try {
      // Start the actual data fetching
      await refetch();
    } catch (error) {
      console.error("❌ Scan failed:", error);
    } finally {
      // Always stop scanning state
      setIsScanning(false);
    }
  };


  const handleSelectAll = () => {
    if ((selectedApprovals?.length || 0) === (approvals?.length || 0)) {
      setSelectedApprovals([]);
    } else {
      setSelectedApprovals((approvals || []).map((approval) => approval.id));
    }
  };

  const handleSelectPage = () => {
    const pageIds = currentApprovals.map((approval) => approval.id);
    const allSelected = pageIds.every((id) =>
      (selectedApprovals || []).includes(id)
    );

    if (allSelected) {
      setSelectedApprovals(
        (selectedApprovals || []).filter((id) => !pageIds.includes(id))
      );
    } else {
      setSelectedApprovals([
        ...new Set([...(selectedApprovals || []), ...pageIds]),
      ]);
    }
  };

  // Duplicate definitions removed - already defined above

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors">
      {/* Header */}
      <header className="bg-white/80 dark:bg-black/80 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="p-2">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center ">
              <Image
                src="/splash.png"
                alt="Revoke Mini"
                width={28}
                height={28}
                className="w-8 h-8 rounded-full drop-shadow-md"
              />
              <span className="text-lg text-[#5e2792] font-extrabold tracking-wide ml-1  drop-shadow-md">
                fRevoke
              </span>
            </div>

            {/* Unified Wallet & Chain Selector */}
            <div className="flex items-center gap-2">
              <WalletChainSelector
                selectedChainId={selectedChainId}
                onChainChange={setSelectedChainId}
                isWalletConnected={isWalletConnected}
                address={address}
              />

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {isDark ? (
                  <SunIcon className="w-4 h-4 text-yellow-500" />
                ) : (
                  <MoonIcon className="w-4 h-4 text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-2">
        {/* Connect Button */}
        {!isWalletConnected && (
          <div className="text-center mb-8">
            <ConnectButton />

            {/* Smart help based on wallet status */}
            {walletStatus.needsHelp && (
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                  <div>• Try refreshing the page</div>
                  {walletStatus.hasError && (
                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                      <div className="font-medium text-red-800 dark:text-red-200">
                        Error:
                      </div>
                      <div className="text-red-700 dark:text-red-300">
                        {walletStatus.errorMessage}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Network Mismatch Notice */}

        {/* Scan Section */}
        {isWalletConnected && (
          <div className="text-center my-4">
            <button
              onClick={handleScan}
              disabled={isScanning}
              className="inline-flex items-center space-x-2 px-6 py-2 shadow-md bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg font-medium transition-colors"
            >
              {/* Scan icon with animation */}
              <svg
                className={`w-5 h-5 `}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 7V5a2 2 0 012-2h2M21 7V5a2 2 0 00-2-2h-2M3 17v2a2 2 0 002 2h2M21 17v2a2 2 0 01-2 2h-2M8 12h8"
                />
              </svg>
              <span>{isScanning ? "Scanning..." : "Refresh Approvals"}</span>
            </button>

            {/* Scan progress indicator */}
            {isScanning && (
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                  <span>
                    Scanning {getChainName(selectedChainId)} for active
                    approvals...
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Batch Operations */}
        {isWalletConnected && selectedApprovals.length > 0 && (
          <BatchOperations
            selectedApprovals={selectedApprovals}
            approvals={approvals || []}
            onBatchRevoke={async (selectedApprovalObjects) => {
              try {
                // Clear selected approvals before revoke to prevent UI issues
                setSelectedApprovals([]);

                // Store revoke count and chain for sharing - ONLY when transaction is actually sent
                // This will be set in the success handler, not here
                await revoke(selectedApprovalObjects);

                // NO AUTO REFRESH - let user manually refresh if needed
              } catch (error) {
                console.error("❌ Batch revoke error:", error);
                // Error is already handled in useRevoke hook
                // Reset revoke count on error
                setLastRevokeCount(0);
                setLastRevokeChain("");
              }
            }}
            isRevoking={isRevoking}
          />
        )}

        {/* Token Approvals Table - Only show when connected, not scanning, and has data */}
        {isWalletConnected &&
          !isScanning &&
          approvals &&
          approvals.length > 0 && (
            <>
              <TokenApprovalsTable
                approvals={approvals}
                selectedApprovals={selectedApprovals}
                onSelectApproval={(approvalId, selected) => {
                  if (selected) {
                    setSelectedApprovals([
                      ...(selectedApprovals || []),
                      approvalId,
                    ]);
                  } else {
                    setSelectedApprovals(
                      (selectedApprovals || []).filter(
                        (id) => id !== approvalId
                      )
                    );
                  }
                }}
                onSelectAll={handleSelectAll}
                onSelectPage={handleSelectPage}
                currentApprovals={currentApprovals}
                onRevoke={(approval) => revoke([approval])}
                isRevoking={isRevoking}
                onEditAllowance={beginEdit}
                editingApprovalId={editingApprovalId}
                editValue={editValue}
                onEditValueChange={handleInputChange}
                onSaveEdit={(approval) => {
                  if (editValue.trim() && !inputError) {
                    setAllowance(approval, editValue.trim());
                    setEditingApprovalId(null);
                    setEditValue("");
                    setInputError("");
                  }
                }}
                onCancelEdit={cancelEdit}
                inputError={inputError}
                formatBalance={formatBalance}
                formatAllowance={formatAllowance}
                formatDecimalExample={formatDecimalExample}
                copyToClipboard={copyToClipboard}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
              />

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                startIndex={startIndex}
                endIndex={endIndex}
                totalItems={approvals.length}
                onPageChange={setCurrentPage}
              />
            </>
          )}

        {/* Transaction Status */}
        {status && (
          <div className="mt-6">
            <TransactionStatus
              status={status}
              transactionHash={transactionHash}
              onToastShown={() => {
                // Refresh table when toast is shown for CONFIRMED status
                if (status.status === "CONFIRMED") {
                  setTimeout(() => {
                    handleAutoScan();
                  }, 1000); // 1 second after toast is shown
                }
              }}
            />
          </div>
        )}

        {/* Loading State - Unified */}
        {isScanning && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              Scanning approvals...
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
              Checking {getChainName(selectedChainId)} for active approvals...
            </p>
          </div>
        )}

        {/* Error State */}
        {approvalsError && (
          <div className="text-center py-8">
            <XMarkIcon className="w-8 h-8 text-red-500 mx-auto mb-4" />
            <p className="text-xs text-red-600 dark:text-red-400">
              Error loading approvals
            </p>
            <button
              onClick={() => refetch()}
              className="mt-2 text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Try again
            </button>
          </div>
        )}

        {/* No Results State - Only show after scan is completed */}
        {isWalletConnected &&
          !isScanning &&
          !approvalsError &&
          approvals &&
          approvals.length === 0 && (
            <div className="text-center py-8">
              <CheckCircleIcon className="w-8 h-8 text-green-500 mx-auto mb-4" />
              <p className="text-xs text-gray-600 dark:text-gray-400">
                No active approvals found
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Your wallet is secure! No tokens have been approved for spending
                on {getChainName(selectedChainId)}.
              </p>
            </div>
          )}

        {/* Share Modal - Only show for successful revoke operations */}
        {showShareModal && lastRevokeCount > 0 && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg max-w-sm w-full border border-slate-200 dark:border-slate-800">
              {/* Header with indigo */}
              <div className="bg-indigo-600 rounded-t-xl px-4 py-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-white" />
                  <h3 className="text-sm font-medium text-white">
                    🎉 Wallet Secured!
                  </h3>
                </div>
              </div>

              <div className="p-4">
                <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 text-center">
                  Keep my crypto safe, keep my wallet
                </p>

                <div className="space-y-2">
                  <button
                    onClick={handleComposeCast}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                  >
                    <ShareIcon className="w-3 h-3" />
                    Share on Farcaster
                  </button>
                  <button
                    onClick={() => {
                      setShowShareModal(false);
                      setLastRevokeCount(0);
                      setLastRevokeChain("");

                      // Refresh table after modal is closed
                      handleAutoScan();
                    }}
                    className="w-full px-3 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors text-xs border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
