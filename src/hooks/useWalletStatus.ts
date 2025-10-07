'use client'

import { useState, useEffect } from 'react'
import { useAccount, useConnect } from 'wagmi'

export interface WalletStatus {
  isConnected: boolean
  isConnecting: boolean
  hasError: boolean
  errorMessage?: string
  needsHelp: boolean
}

export function useWalletStatus(): WalletStatus {
  const { address, isConnected } = useAccount()
  const { status, error } = useConnect()
  const [needsHelp, setNeedsHelp] = useState(false)

  // Track connection attempts and errors
  useEffect(() => {
    if (status === 'error' || (!isConnected && !address)) {
      setNeedsHelp(true)
    } else if (isConnected && address) {
      setNeedsHelp(false)
    }
  }, [status, isConnected, address])

  return {
    isConnected: !!address,
    isConnecting: status === 'pending',
    hasError: status === 'error',
    errorMessage: error?.message,
    needsHelp
  }
}
