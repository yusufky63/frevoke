'use client'

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface RevokeButtonProps {
  selectedApprovals: string[]
  onRevoke: (approvals: string[]) => void
  isRevoking: boolean
}

export function RevokeButton({ selectedApprovals, onRevoke, isRevoking }: RevokeButtonProps) {
  const selectedCount = selectedApprovals?.length || 0
  
  const handleClick = () => {
    // Directly call onRevoke without confirmation dialog
    // Farcaster Mini Apps don't support window.confirm()
    onRevoke(selectedApprovals)
  }

  if (selectedCount === 0) return null

  return (
    <div className="bg-white/80 dark:bg-black/80 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ExclamationTriangleIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
          <div>
            <div className="text-xs font-medium text-gray-900 dark:text-gray-100">
              {selectedCount} selected
            </div>
          </div>
        </div>
        
        <button
          onClick={handleClick}
          disabled={isRevoking}
          className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
            isRevoking
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          {isRevoking ? 'Revoking...' : 'Revoke'}
        </button>
      </div>
    </div>
  )
}



