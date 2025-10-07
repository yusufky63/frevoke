'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { getCurrentApprovalsOnly } from '@/lib/alchemy'
import { getApprovalsFromMoralis, isMoralisSupportedChain } from '@/lib/moralis'
import type { Approval } from '@/lib/types'

// No cache - always fetch fresh data

interface UseApprovalsAlchemyReturn {
  approvals: Approval[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useApprovalsAlchemy(chainId: number): UseApprovalsAlchemyReturn {
  const { address } = useAccount()
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inFlight = useRef(false)

  const fetchApprovals = useCallback(async () => {
    if (!address) {
      setApprovals([])
      return
    }

    // Prevent overlapping scans
    if (inFlight.current) {
      return
    }

    // Determine provider (prefer Moralis when available + supported)
    const preferMoralis = isMoralisSupportedChain(chainId) && !!process.env.NEXT_PUBLIC_MORALIS_API_KEY

    // Always fetch fresh data - no cache

    // Clear any existing approvals when starting new fetch
    setApprovals([])

    setLoading(true)
    setError(null)
    setApprovals([])
    inFlight.current = true

    try {
      
      // Comprehensive approval check - Revoke.cash benzeri

      let activeApprovals: Approval[] = []

      if (preferMoralis) {
        activeApprovals = await getApprovalsFromMoralis(address, chainId)
      } else {
        const optimizedApprovals = await getCurrentApprovalsOnly(address, chainId)
        activeApprovals = optimizedApprovals.map(approval => ({
          id: approval.id,
          tokenAddress: approval.tokenAddress,
          tokenName: approval.tokenName,
          tokenSymbol: approval.tokenSymbol,
          tokenDecimals: approval.tokenDecimals,
          spender: approval.spender,
          allowance: approval.amount,
          amount: approval.amount,
          formattedAmount: approval.formattedAmount,
          type: approval.type,
          blockNumber: 0,
          transactionHash: '',
          timestamp: Date.now(),
          source: 'alchemy-optimized',
          tokenLogo: approval.tokenLogo,
          tokenDescription: approval.tokenDescription,
          tokenWebsite: approval.tokenWebsite,
          tokenTwitter: approval.tokenTwitter,
          tokenDiscord: approval.tokenDiscord,
          tokenTelegram: approval.tokenTelegram,
        }))
      }

      if (activeApprovals.length === 0) {
        setApprovals([])
        return
      }


      setApprovals(activeApprovals)

    } catch (err) {
      console.error('[OptimizedApprovals] Error fetching approvals:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch approvals')
      setApprovals([])
    } finally {
      inFlight.current = false
      setLoading(false)
    }
  }, [address, chainId])

  // Otomatik tarama - wallet bağlandığında ve chain değiştiğinde (3 saniye sonra)
  useEffect(() => {
    if (address && chainId) {
      const timeoutId = setTimeout(() => {
        fetchApprovals()
      }, 3000) // 3 saniye sonra otomatik tarama
      
      return () => clearTimeout(timeoutId)
    }
  }, [fetchApprovals, address, chainId])

  return {
    approvals,
    loading,
    error,
    refetch: () => fetchApprovals() // Always fetch fresh data
  }
}
