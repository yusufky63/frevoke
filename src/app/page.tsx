"use client";

import { useState, useEffect } from "react";
import { useAccount, useChainId } from "wagmi";
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
import { SuccessModal } from "@/components/modals/SuccessModal";
import { OtherAppsModal } from "@/components/modals/OtherAppsModal";
import { LoadingState } from "@/components/states/LoadingState";
import { EmptyState } from "@/components/states/EmptyState";
import { ScanButton } from "@/components/ScanButton";
import { useChainSwitch } from "@/hooks/useChainSwitch";
import { useAutoScan } from "@/hooks/useAutoScan";
import { getChainName } from "@/lib/chain-config";
import { sdk } from "@farcaster/miniapp-sdk";
import { SunIcon, MoonIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

export default function HomePage() {
  const { address } = useAccount();
  const [isDark, setIsDark] = useState(false);
  const walletStatus = useWalletStatus();
  const { switchToChain } = useChainSwitch();

  const isWalletConnected = !!address;
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedChainId, setSelectedChainId] = useState<number>(8453);
  const currentChainId = useChainId();

  // Use only optimized version for fast performance
  const {
    approvals,
    loading: approvalsLoading,
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
  const [showAppsModal, setShowAppsModal] = useState<boolean>(false);
  const [lastRevokeCount, setLastRevokeCount] = useState<number>(0);
  const [lastRevokeChain, setLastRevokeChain] = useState<string>("");

  const { triggerAutoScan } = useAutoScan({
    refetch,
    delay: 1000,
  });

  const { revoke, setAllowance, status, transactionHash, isRevoking } =
    useRevoke(
      selectedChainId,
      async (count, chainName) => {
        setLastRevokeCount(count);
        setLastRevokeChain(chainName);

        if (count > 0) {
          setShowShareModal(true);
        }

        await triggerAutoScan();
      },
      async () => {
        await triggerAutoScan();
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
      const text = `Just secured my wallet by revoking ${lastRevokeCount} token approval${
        lastRevokeCount > 1 ? "s" : ""
      } on ${chainName}! 

Using @fRevoke to keep my crypto safe 🛡️

#fRevoke`;

      await sdk.actions.composeCast({
        text,
        embeds: [window.location.href],
      });

      setShowShareModal(false);
      setLastRevokeCount(0);
      setLastRevokeChain("");

      await triggerAutoScan();
    } catch {
      // Silent fail
    }
  };

  // Auto add Mini App on page load
  useEffect(() => {
    const autoAddMiniApp = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await handleAddMiniApp();
      } catch {
        // Silent fail
      }
    };

    autoAddMiniApp();
  }, []);

  // Auto switch to selected chain on page load
  useEffect(() => {
    const performAutoSwitch = async () => {
      if (
        isWalletConnected &&
        selectedChainId &&
        currentChainId !== selectedChainId
      ) {
        try {
          await switchToChain(selectedChainId);
        } catch {
          // Silent fail
        }
      }
    };

    const timer = setTimeout(performAutoSwitch, 1000);
    return () => clearTimeout(timer);
  }, [isWalletConnected, selectedChainId, currentChainId, switchToChain]);

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

  // Scan handler - just call refetch, loading handled by hook
  const handleScan = async () => {
    await refetch();
  };

  // Clear table when chain changes
  useEffect(() => {
    // Clear all UI state when chain changes
    setSelectedApprovals([]);
    setFilteredApprovals([]);
    setCurrentPage(1);
    setSearchTerm("");
    setEditingApprovalId(null);
    setEditValue("");
    setInputError("");
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
      <main className="p-2 pb-16">
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
          <ScanButton
            onScan={handleScan}
            isScanning={approvalsLoading}
            chainName={getChainName(selectedChainId)}
          />
        )}

        {/* Batch Operations */}
        {isWalletConnected && selectedApprovals.length > 0 && (
          <BatchOperations
            selectedApprovals={selectedApprovals}
            approvals={approvals || []}
            onBatchRevoke={async (selectedApprovalObjects) => {
              try {
                setSelectedApprovals([]);
                await revoke(selectedApprovalObjects);
              } catch {
                setLastRevokeCount(0);
                setLastRevokeChain("");
              }
            }}
            isRevoking={isRevoking || approvalsLoading}
          />
        )}

        {/* Token Approvals Table - Show when connected and has data */}
        {isWalletConnected &&
          !approvalsLoading &&
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
                if (status.status === "CONFIRMED") {
                  setTimeout(async () => {
                    await triggerAutoScan();
                  }, 1000);
                }
              }}
            />
          </div>
        )}

        {/* Loading State */}
        {isWalletConnected && approvalsLoading && (
          <LoadingState chainName={getChainName(selectedChainId)} />
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

        {/* Empty State - Show when not loading and no approvals */}
        {isWalletConnected &&
          !approvalsLoading &&
          !approvalsError &&
          approvals &&
          approvals.length === 0 && (
            <EmptyState chainName={getChainName(selectedChainId)} />
          )}

        {/* Success Modal */}
        <SuccessModal
          isOpen={showShareModal}
          onClose={async () => {
            setShowShareModal(false);
            setLastRevokeCount(0);
            setLastRevokeChain("");
            await triggerAutoScan();
          }}
          revokeCount={lastRevokeCount}
          chainName={lastRevokeChain}
          onShare={handleComposeCast}
        />

        {/* Other Apps Modal */}
        <OtherAppsModal
          isOpen={showAppsModal}
          onClose={() => setShowAppsModal(false)}
        />
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-2 px-4 z-40">
        <button
          onClick={() => setShowAppsModal(true)}
          className="w-full text-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
        >
          Other Apps
        </button>
      </footer>
    </div>
  );
}
