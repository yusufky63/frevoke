"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useSwitchChain } from "wagmi";
import { getAllChainConfigs } from "@/lib/chain-config";
import { sdk } from "@farcaster/miniapp-sdk";
import Image from "next/image";

interface WalletChainSelectorProps {
  selectedChainId: number;
  onChainChange: (chainId: number) => void;
  isWalletConnected: boolean;
  address?: string;
}

export function WalletChainSelector({
  selectedChainId,
  onChainChange,
  isWalletConnected,
  address,
}: WalletChainSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { switchChain } = useSwitchChain();

  // Get all chain configs from centralized config
  const chains = getAllChainConfigs().map((chain) => ({
    id: chain.id,
    name: chain.name,
    symbol: chain.symbol,
    color: `bg-[${chain.color}]`, // Use dynamic color from config
    iconUrl: chain.iconUrl,
  }));

  const selectedChain = chains.find((chain) => chain.id === selectedChainId);

  // Calculate dropdown position
  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  // Auto switch chain function
  const autoSwitchChain = async (chainId: number) => {
    if (isSwitching) return;

    setIsSwitching(true);

    try {
      // Use Farcaster SDK for chain switching in Mini Apps
      const provider = await sdk.wallet.getEthereumProvider();
      if (provider && provider.request) {
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${chainId.toString(16)}` }],
        });
        console.log(
          `[WalletChainSelector] Successfully switched to chain ${chainId}`
        );
      } else {
        throw new Error("Farcaster provider not available");
      }
    } catch (error) {
      console.error(
        "[WalletChainSelector] Farcaster SDK chain switch failed:",
        error
      );

      // Fallback to Wagmi if Farcaster fails
      try {
        console.log("[WalletChainSelector] Trying Wagmi fallback...");
        await switchChain({ chainId });
        console.log(
          `[WalletChainSelector] Wagmi fallback successful for chain ${chainId}`
        );
      } catch (wagmiError) {
        console.error(
          "[WalletChainSelector] Wagmi fallback also failed:",
          wagmiError
        );
        throw new Error(`Failed to switch to chain ${chainId}`);
      }
    } finally {
      setIsSwitching(false);
    }
  };

  // Click outside to close and update position
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleScroll() {
      if (isOpen) {
        updateDropdownPosition();
      }
    }

    if (isOpen) {
      updateDropdownPosition();
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
      window.addEventListener("resize", handleScroll);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        window.removeEventListener("scroll", handleScroll, true);
        window.removeEventListener("resize", handleScroll);
      };
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={() => {
          console.log(
            `[WalletChainSelector] Opening dropdown for chain ${selectedChainId}`
          );
          setIsOpen(!isOpen);
        }}
        className="flex items-center justify-between w-full p-3 text-xs bg-white/80 dark:bg-transparent backdrop-blur-xl border border-gray-300/50 dark:border-gray-600/50 rounded-lg hover:bg-white/90 dark:hover:bg-gray-800/90 transition-all duration-200"
      >
        {/* Left side - Wallet info */}
        <div className="flex items-center space-x-2">
         
          <Image
            src={selectedChain?.iconUrl || ""}
            alt={selectedChain?.name || ""}
            width={20}
            height={20}
            className="w-4 h-4 rounded-full"
          />
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {isSwitching
              ? "Switching..."
              : selectedChain?.name || "Select Chain"}
          </span>
          <div className="text-left">
            {isWalletConnected ? (
              <div className="text-gray-900 dark:text-gray-100">
                <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                  {address?.slice(0, 3)}...{address?.slice(-2)}
                </div>
              </div>
            ) : (
              <div className="text-gray-500 dark:text-gray-400 text-xs">
                Not Connected
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <svg
              className={`w-4 h-4 transition-transform text-gray-500 dark:text-gray-400 ${
                isOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        {/* Right side - Chain info with arrow */}
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl border border-gray-200/50 dark:border-gray-700/50 rounded-lg shadow-2xl z-[999999]"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
              minWidth: "192px", // w-48 equivalent
            }}
          >
            <div className="py-1">
              {chains.map((chain) => (
                <button
                  key={chain.id}
                  onClick={async () => {
                    console.log(
                      `[WalletChainSelector] Selected chain ${chain.id} (${chain.name})`
                    );

                    // Update selected chain first
                    onChainChange(chain.id);
                    setIsOpen(false);

                    // Auto switch to the selected chain
                    try {
                      await autoSwitchChain(chain.id);
                    } catch (error) {
                      console.error(
                        `[WalletChainSelector] Failed to auto switch to chain ${chain.id}:`,
                        error
                      );
                      // Chain switch failed, but we still update the UI
                    }
                  }}
                  className={`w-full text-left  py-2 text-xs hover:bg-white/80 dark:hover:bg-gray-700/80 transition-all duration-200 ${
                    selectedChainId === chain.id
                      ? "bg-indigo-50/80 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                      : "text-gray-900 dark:text-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${chain.color}`}
                    ></span>
                    {chain.iconUrl ? (
                      <Image
                        src={chain.iconUrl}
                        alt={chain.name}
                        width={20}
                        height={20}
                        className="w-4 h-4 rounded-full"
                      />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                          {chain.symbol.charAt(0)}
                        </span>
                      </div>
                    )}
                    <span className="font-medium">{chain.name}</span>
                    <span className="text-gray-500 dark:text-gray-400">
                      ({chain.symbol})
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
