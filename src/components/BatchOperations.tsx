'use client'

import { 
  CheckCircleIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import type { Approval } from '@/lib/types'

interface BatchOperationsProps {
  selectedApprovals: string[]
  approvals: Approval[]
  onBatchRevoke: (approvals: Approval[]) => void
  isRevoking: boolean
}

export function BatchOperations({ 
  selectedApprovals, 
  approvals, 
  onBatchRevoke, 
  isRevoking 
}: BatchOperationsProps) {
  const selectedCount = selectedApprovals.length
  const selectedApprovalObjects = approvals.filter(approval => 
    selectedApprovals.includes(approval.id)
  )

  const handleBatchRevoke = () => {
    onBatchRevoke(selectedApprovalObjects)
  }



  if (selectedCount === 0) return null

  return (
    <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2 mb-2 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Left side - Selection info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <CheckCircleIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {selectedCount} Selected
            </span>
          </div>
        </div>

        {/* Right side - Batch action button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleBatchRevoke}
            disabled={isRevoking}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              isRevoking
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                : 'bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg transform hover:scale-105'
            }`}
          >
            <TrashIcon className="w-4 h-4" />
            {isRevoking ? 'Revoking...' : 'Revoke All'}
          </button>
        </div>
      </div>

    </div>
  )
}

