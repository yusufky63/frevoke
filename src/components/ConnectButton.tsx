
'use client'

import { useEffect } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { isInMiniApp } from '@/lib/miniapps'

export function ConnectButton() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, status, error } = useConnect()
  const { disconnect } = useDisconnect()

  // Auto-connect with Farcaster connector if in Mini App
  useEffect(() => {
    if (!isConnected && isInMiniApp()) {
      const farcasterConnector = connectors.find(c => c.id === 'farcasterMiniApp')
      if (farcasterConnector) {
        connect({ connector: farcasterConnector })
      }
    }
  }, [isConnected, connectors, connect])

  // Show connected state
  if (address) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <button
          onClick={() => disconnect()}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg text-sm font-medium transition-colors"
        >
          Disconnect
        </button>
      </div>
    )
  }

  // Get primary connector
  const farcasterConnector = connectors.find(c => c.id === 'farcasterMiniApp')
  const injectedConnector = connectors.find(c => c.id === 'injected')
  const primaryConnector = farcasterConnector || injectedConnector

  return (
    <div className="flex flex-col items-stretch gap-2">
      <button
        onClick={() => primaryConnector && connect({ connector: primaryConnector })}
        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!primaryConnector}
      >
        {primaryConnector ? 'Connect Wallet' : 'No Wallet Found'}
      </button>
      
      {status === 'error' && (
        <span className="text-xs text-red-600">{error?.message || 'Failed to connect'}</span>
      )}
      
      {status === 'pending' && (
        <span className="text-xs text-yellow-600 dark:text-yellow-400">
          ⏳ Connecting...
        </span>
      )}
      
      {!primaryConnector && (
        <span className="text-xs text-gray-500">
          {isInMiniApp() 
            ? 'Farcaster wallet not available'
            : 'No wallet found'
          }
        </span>
      )}
    </div>
  )
}
