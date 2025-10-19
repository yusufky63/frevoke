"use client";

import { ShareIcon, XMarkIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  revokeCount: number;
  chainName: string;
  onShare: () => void;
}

export function SuccessModal({
  isOpen,
  onClose,
  revokeCount,
  chainName,
  onShare,
}: SuccessModalProps) {
  if (!isOpen || revokeCount === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-sm w-full border border-gray-200 dark:border-gray-800 animate-slide-up">
        {/* Header */}
        <div className="relative bg-green-600 rounded-t-2xl px-6 py-4">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-3">
              <ShieldCheckIcon className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              🎉 Wallet Secured!
            </h3>
            <p className="text-sm text-white/90">
              {revokeCount} approval{revokeCount > 1 ? "s" : ""} revoked
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Stats Card */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 mb-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Chain</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{chainName}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Revoked</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{revokeCount}</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-center text-gray-600 dark:text-gray-400 mb-4">
            Your tokens are now safer! Share your security milestone with the community.
          </p>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={onShare}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              <ShareIcon className="w-4 h-4" />
              Share on Farcaster
            </button>
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors text-sm font-medium border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

