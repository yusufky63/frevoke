"use client";

interface LoadingStateProps {
  chainName: string;
}

export function LoadingState({ chainName }: LoadingStateProps) {
  return (
    <div className="space-y-3">
      {/* Progress indicator */}
      <div className="text-center py-4">
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Scanning {chainName} for active approvals...
          </span>
        </div>
      </div>

      {/* Skeleton cards */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-3 animate-pulse"
        >
          <div className="flex items-center gap-3">
            {/* Checkbox skeleton */}
            <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            
            {/* Logo skeleton */}
            <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            
            {/* Token info skeleton */}
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            </div>
            
            {/* Button skeleton */}
            <div className="w-16 h-7 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

