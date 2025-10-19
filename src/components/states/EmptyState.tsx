"use client";

import { CheckCircleIcon } from "@heroicons/react/24/outline";

interface EmptyStateProps {
  chainName: string;
}

export function EmptyState({ chainName }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <CheckCircleIcon className="w-12 h-12 text-green-600 mx-auto mb-4" />
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
        No Active Approvals Found
      </p>
      <p className="text-xs text-gray-600 dark:text-gray-400 max-w-xs mx-auto">
        Your wallet is secure! No tokens have been approved for spending on {chainName}.
      </p>
    </div>
  );
}

