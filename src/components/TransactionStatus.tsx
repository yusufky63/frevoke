'use client'

import { useEffect, useState } from 'react'
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline'
import type { TransactionStatus as TxStatus } from '@/lib/types'
import { getExplorerUrl } from '@/lib/chain-config'
import { useChainId } from 'wagmi'

interface TransactionStatusProps {
  status: TxStatus
  transactionHash?: string
  onToastShown?: () => void
}

export function TransactionStatus({ status, transactionHash, onToastShown }: TransactionStatusProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const chainId = useChainId()

  useEffect(() => {
    // Only show toast for meaningful status changes
    // Don't show for initial PENDING without messages
    if (status.status === 'PENDING' && !status.message) {
      setIsVisible(false)
      return
    }
    
    // Show CONFIRMED even without transaction hash if we have a success message
    if (status.status === 'CONFIRMED' && !status.message && !status.hash && !transactionHash) {
      setIsVisible(false)
      return
    }

    // Show toast for all meaningful status changes
    const shouldShowToast = 
      (status.status === 'PENDING' && status.message) ||
      (status.status === 'CONFIRMED') ||
      (status.status === 'FAILED' && status.error)
    
    if (shouldShowToast) {
      setIsAnimating(true)
      setIsVisible(true)
      
      // Call callback when toast is shown
      if (onToastShown) {
        onToastShown();
      }
      
      // Auto-hide success messages after 6 seconds (longer for success)
      if (status.status === 'CONFIRMED') {
        const timer = setTimeout(() => {
          setIsAnimating(false)
          setTimeout(() => setIsVisible(false), 300)
        }, 6000)
        return () => clearTimeout(timer)
      }

      // Auto-hide error messages after 6 seconds
      if (status.status === 'FAILED') {
        const timer = setTimeout(() => {
          setIsAnimating(false)
          setTimeout(() => setIsVisible(false), 300)
        }, 6000)
        return () => clearTimeout(timer)
      }

      // Auto-hide pending messages after 3 seconds
      if (status.status === 'PENDING') {
        const timer = setTimeout(() => {
          setIsAnimating(false)
          setTimeout(() => setIsVisible(false), 300)
        }, 3000)
        return () => clearTimeout(timer)
      }
    } else {
      setIsVisible(false)
    }
  }, [status.status, status.hash, status.message, status.error, transactionHash])

  if (!isVisible) return null

  const getStatusIcon = () => {
    switch (status.status) {
      case 'CONFIRMED':
        return (
          <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
            <CheckCircleIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
        )
      case 'FAILED':
        return (
          <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <XCircleIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
        )
      case 'PENDING':
        return (
          <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center">
            <ClockIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin" />
          </div>
        )
      default:
        return null
    }
  }


  const getStatusText = () => {
    switch (status.status) {
      case 'CONFIRMED':
        return 'Success'
      case 'FAILED':
        return 'Failed'
      case 'PENDING':
        return 'Processing'
      default:
        return 'Unknown'
    }
  }

  const getStatusMessage = () => {
    switch (status.status) {
      case 'CONFIRMED':
        return status.message || '🎉 Approvals revoked successfully! Your wallet is now more secure.'
      case 'FAILED':
        return status.error || 'Transaction failed'
      case 'PENDING':
        return status.message || 'Processing transaction...'
      default:
        return ''
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      <div 
        className={`
          transform transition-all duration-300 ease-in-out
          ${isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
          ${status.status === 'CONFIRMED' 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
          }
          border rounded-xl shadow-xl backdrop-blur-sm p-4
        `}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getStatusIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {getStatusText()}
              </div>
              <button
                onClick={() => {
                  setIsAnimating(false)
                  setTimeout(() => setIsVisible(false), 300)
                }}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <XCircleIcon className="w-4 h-4" />
              </button>
            </div>
            
            {getStatusMessage() && (
              <div className="mt-1 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                {getStatusMessage()}
              </div>
            )}
            
            {(status.hash || transactionHash) && (
              <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {`${(status.hash || transactionHash)?.slice(0, 6)}...${(status.hash || transactionHash)?.slice(-4)}`}
                  </div>
                  <a
                    href={`${getExplorerUrl(chainId)}/tx/${status.hash || transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-mono transition-colors"
                  >
                    <span>View</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}



