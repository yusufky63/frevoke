'use client'

import { useEffect } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'

// Minimal provider to signal Farcaster Mini Apps SDK readiness
export function FarcasterMiniAppsProvider() {
  useEffect(() => {
    const sendReady = async () => {
      try {
        // Resmi Farcaster Mini Apps SDK - dokümantasyona göre
        console.log('Calling sdk.actions.ready() - Official Farcaster SDK')
        await sdk.actions.ready()
        console.log('✅ Farcaster SDK ready() called successfully')
      } catch (error) {
        console.warn('Farcaster SDK ready signal failed:', error)
      }
    }

    // Call ready immediately as per Farcaster documentation
    setTimeout(() => sendReady(), 100)
  }, [])

  return null
}
