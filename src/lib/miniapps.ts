// Utilities for Farcaster Mini Apps detection and readiness
import { sdk } from '@farcaster/miniapp-sdk'

export function isInMiniApp(): boolean {
  if (typeof window === 'undefined') return false
  const w = window as Window & { miniapps?: unknown; sdk?: unknown }
  return !!(w.miniapps || w.sdk)
}

export function signalMiniAppReady() {
  if (typeof window === 'undefined') return
  
  try {
    // Resmi Farcaster Mini Apps SDK - dokümantasyona göre
    sdk.actions.ready()
  } catch (error) {
  }
}

