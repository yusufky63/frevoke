'use client'

import { useEffect } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'

// Farcaster Mini Apps SDK readiness - dokümantasyona göre
export function FarcasterMiniAppsProvider() {
  useEffect(() => {
    // Call ready as soon as possible while avoiding jitter and content reflows
    // Dokümantasyona göre: "You should call ready as soon as possible while avoiding jitter and content reflows"
    sdk.actions.ready()
      .then(() => {
        console.log('✅ Farcaster SDK ready() called successfully')
      })
      .catch((error) => {
        console.warn('Farcaster SDK ready signal failed:', error)
      })
  }, [])

  return null
}
