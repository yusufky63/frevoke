'use client'

import { useState, useEffect } from 'react'
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline'
import type { Approval } from '@/lib/types'

interface ApprovalFiltersProps {
  approvals: Approval[]
  onFilteredApprovals: (filtered: Approval[]) => void
}

export function ApprovalFilters({ approvals, onFilteredApprovals }: ApprovalFiltersProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  const filterApprovals = () => {
    let filtered = [...approvals]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(approval => 
        approval.tokenName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        approval.tokenSymbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        approval.tokenAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        approval.spender.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(approval => approval.type === selectedType)
    }

    onFilteredApprovals(filtered)
  }

  // Auto-filter when search or type changes
  useEffect(() => {
    filterApprovals()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedType, approvals])

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedType('all')
    onFilteredApprovals(approvals)
  }

  const hasActiveFilters = searchTerm || selectedType !== 'all'

  return (
    <div className="bg-white/80 dark:bg-black/80 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4">
      {/* Search Bar */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search tokens, addresses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2 rounded-lg transition-colors ${
            showFilters 
              ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400' 
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
          }`}
        >
          <FunnelIcon className="w-4 h-4" />
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="p-2 rounded-lg bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400 transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Options */}
      {showFilters && (
        <div className="space-y-3">
          {/* Type Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Token Type
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'All' },
                { value: 'ERC20', label: 'ERC-20' },
                { value: 'ERC721', label: 'ERC-721' },
                { value: 'ERC1155', label: 'ERC-1155' }
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => setSelectedType(type.value)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    selectedType === type.value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
