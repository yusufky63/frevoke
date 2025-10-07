"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useSwitchChain } from "wagmi";
import { getAllChainConfigs } from "@/lib/chain-config";
import { sdk } from "@farcaster/miniapp-sdk";
import Image from "next/image";

interface ChainSelectorProps {
  selectedChainId: number;
  onChainChange: (chainId: number) => void;
}

export function ChainSelector({
  selectedChainId,
  onChainChange,
}: ChainSelectorProps) {
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
    iconUrl: chain.iconUrl
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
      
      } else {
        throw new Error("Farcaster provider not available");
      }
    } catch (error) {
      console.error(
        "[ChainSelector] Farcaster SDK chain switch failed:",
        error
      );

      // Fallback to Wagmi if Farcaster fails
      try {
        console.log("[ChainSelector] Trying Wagmi fallback...");
        await switchChain({ chainId });
        console.log(
          `[ChainSelector] Wagmi fallback successful for chain ${chainId}`
        );
      } catch (wagmiError) {
        console.error(
          "[ChainSelector] Wagmi fallback also failed:",
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
            `[ChainSelector] Opening dropdown for chain ${selectedChainId}`
          );
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-2 px-3 py-2 text-xs bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-300/50 dark:border-gray-600/50 rounded-lg hover:bg-white/90 dark:hover:bg-gray-800/90 transition-all duration-200"
      >
        <span
          className={`w-2 h-2 rounded-full ${
            selectedChain?.color || "bg-gray-500"
          }`}
        ></span>
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {isSwitching ? "Switching..." : selectedChain?.name || "Select Chain"}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${
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
                      `[ChainSelector] Selected chain ${chain.id} (${chain.name})`
                    );

                    // Update selected chain first
                    onChainChange(chain.id);
                    setIsOpen(false);

                    // Auto switch to the selected chain
                    try {
                      await autoSwitchChain(chain.id);
                    } catch (error) {
                      console.error(
                        `[ChainSelector] Failed to auto switch to chain ${chain.id}:`,
                        error
                      );
                      // Chain switch failed, but we still update the UI
                    }
                  }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-white/80 dark:hover:bg-gray-700/80 transition-all duration-200 ${
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
