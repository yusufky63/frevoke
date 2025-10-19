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
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-3">
      <div className="flex items-center justify-between gap-3">
        {/* Left side - Selection info */}
        <div className="flex items-center gap-2">
          <CheckCircleIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {selectedCount} Selected
          </span>
          {isRevoking && (
            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
          )}
        </div>

        {/* Right side - Batch action button */}
        <button
          onClick={handleBatchRevoke}
          disabled={isRevoking}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <TrashIcon className="w-3.5 h-3.5" />
          {isRevoking ? 'Revoking...' : 'Revoke All'}
        </button>
      </div>
    </div>
  )
}

