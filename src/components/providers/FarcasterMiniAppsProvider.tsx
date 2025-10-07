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
      })
      .catch((error) => {
      })
  }, [])

  return null
}
