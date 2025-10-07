'use client'

import { useState, useCallback, useRef } from 'react'
import { useAccount } from 'wagmi'
import { getCurrentApprovalsOnly } from '@/lib/alchemy'
import { getApprovalsFromMoralis, isMoralisSupportedChain } from '@/lib/moralis'
import type { Approval } from '@/lib/types'

// Simple in-memory cache
const cache = new Map<string, { data: Approval[], timestamp: number }>()
const CACHE_TTL = 10 * 60 * 1000 // 10 dakika (daha uzun cache)

interface UseApprovalsAlchemyReturn {
  approvals: Approval[]
  loading: boolean
  error: string | null
  refetch: () => void
  cacheStats: {
    size: number
    age: number | null
    isValid: boolean
  }
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

    // Check cache first (include provider in key)
    const cacheKey = `${address}-${chainId}-${preferMoralis ? 'moralis' : 'alchemy'}`
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('[OptimizedApprovals] Using cached data')
      setApprovals(cached.data)
      return
    }

    // Clear any existing approvals when starting new fetch
    setApprovals([])

    setLoading(true)
    setError(null)
    setApprovals([])
    inFlight.current = true

    try {
      console.log(`[OptimizedApprovals] Starting fast check for ${address} on chain ${chainId}`)
      
      // Comprehensive approval check - Revoke.cash benzeri
      console.log('[Hook] Using approval discovery...')

      let activeApprovals: Approval[] = []

      if (preferMoralis) {
        console.log('[OptimizedApprovals] Using Moralis provider')
        activeApprovals = await getApprovalsFromMoralis(address, chainId)
      } else {
        console.log('[OptimizedApprovals] Using Etherscan+Alchemy hybrid provider')
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
        console.log('[OptimizedApprovals] No approvals found')
        setApprovals([])
        return
      }

      console.log(`[OptimizedApprovals] Found ${activeApprovals.length} active approvals`)

      setApprovals(activeApprovals)

      // Cache the results
      cache.set(cacheKey, { data: activeApprovals, timestamp: Date.now() })

    } catch (err) {
      console.error('[OptimizedApprovals] Error fetching approvals:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch approvals')
      setApprovals([])
    } finally {
      inFlight.current = false
      setLoading(false)
    }
  }, [address, chainId])

  // Otomatik check kaldırıldı - kullanıcı butona basmalı
  // useEffect(() => {
  //   fetchApprovals()
  // }, [fetchApprovals])

  // Get cache statistics
  const cacheKey = `${address}-${chainId}`
  const cached = cache.get(cacheKey)
  const cacheStats = {
    size: cache.size,
    age: cached ? Date.now() - cached.timestamp : null,
    isValid: cached ? Date.now() - cached.timestamp < CACHE_TTL : false
  }

  return {
    approvals,
    loading,
    error,
    refetch: fetchApprovals,
    cacheStats
  }
}
