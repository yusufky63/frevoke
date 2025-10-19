"use client";

import { XMarkIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

interface App {
  id: string;
  name: string;
  description: string;
  icon: string;
  url: string;
}

interface OtherAppsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const apps: App[] = [
  {
    id: "base-2048",
    name: "Base 2048",
    description: "Play the classic 2048 game on Base.",
    icon: "/assets/apps/base2048-icon.png",
    url: "https://farcaster.xyz/miniapps/QHbC0qgJxMWl/base-2048",
  },
  {
    id: "drawcoin",
    name: "DrawCoin",
    description: "Hand-drawn art tokens on Base",
    icon: "/assets/apps/drawcoin-icon.png",
    url: "https://farcaster.xyz/miniapps/dc-pPO5wFd6-/drawcoin",
  },
  {
    id: "base-counter",
    name: "Base Counter",
    description: "On-chain counter for Base.",
    icon: "/assets/apps/base-counter-icon.png",
    url: "https://farcaster.xyz/miniapps/7upwS7ktoVAn/base-counter",
  },
  {
    id: "8bitcoiner",
    name: "8BitCoiner",
    description: "Retro tokens on Base",
    icon: "/assets/apps/8bitcoiner-icon.png",
    url: "https://farcaster.xyz/miniapps/VJFTWn45l8cA/8bitcoiner",
  },
  {
    id: "cosmic-raid",
    name: "Cosmic Raid",
    description: "Epic space shooter with boss battles and ship upgrades!",
    icon: "/assets/apps/cosmic-raid-icon.png",
    url: "https://farcaster.xyz/miniapps/5waKPt3EmWBJ/cosmic-raid",
  },
  {
    id: "farsender",
    name: "FarSender",
    description: "Send tokens to multiple addresses easily.",
    icon: "/assets/apps/farsender-icon.png",
    url: "https://farcaster.xyz/miniapps/x39YyDYuusxa/farsender",
  },
  {
    id: "monad-counter",
    name: "Monad Counter",
    description: "On-chain counter for Monad.",
    icon: "/assets/apps/monad-counter-icon.png",
    url: "https://farcaster.xyz/miniapps/xBGkTrC41Qaj/monad-counter",
  },
];

export function OtherAppsModal({ isOpen, onClose }: OtherAppsModalProps) {
  if (!isOpen) return null;

  const handleAppClick = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-200 dark:border-gray-800 animate-slide-up max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative bg-indigo-600 rounded-t-2xl px-4 py-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center text-center">
            <h3 className="text-lg font-bold text-white mb-1">
            Other Mini Apps
            </h3>
            <p className="text-sm text-white/90">
              Discover more amazing apps
            </p>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="p-3 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {apps.map((app) => (
              <button
                key={app.id}
                onClick={() => handleAppClick(app.url)}
                className="flex items-start gap-2 p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group text-left"
              >
                {/* App Icon */}
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0 border border-gray-200 dark:border-gray-700">
                  <Image
                    src={app.icon}
                    alt={app.name}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center text-2xl">${app.name[0]}</div>`;
                    }}
                  />
                </div>

                {/* App Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-1">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {app.name}
                    </h4>
                    <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex-shrink-0" />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                    {app.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl flex-shrink-0">
          <p className="text-xs text-center text-gray-600 dark:text-gray-400">
            Built with ❤️ for the Farcaster ecosystem
          </p>
        </div>
      </div>
    </div>
  );
}

